const fs = require('fs');
const path = require('path');

// TeX-to-Markdown converter for the BDMA chapters, organized as three passes.
// The parse pass turns every chapter, line by line, into a list of plain
// nodes through the pattern-action block rules below: each rule is [mode,
// pattern, action], the first rule whose mode and pattern match runs, and
// actions receive the regex match and the parse state. The collect pass walks
// all parsed chapters to build the cross-reference table. The emit pass
// serializes each chapter's nodes to Markdown.
//
// Identity data, such as section and theorem numbers, is fixed at parse time
// and stored on nodes, while anything unique per appearance in the output,
// such as equation tags, footnote numbers, and citation anchors, is assigned
// at emit time, so replayed restatable bodies number correctly. Structural
// errors fail at parse time with file and line; the emit pass resolves
// references against the completed table and fails loudly if an emitted
// chapter references an unknown label.

const THEOREM_KINDS = 'definition|theorem|example|exercise|lemma|proposition|result';

// Cross-reference table built by the collect pass: label -> {kind, number,
// url, anchor}, harvested from labeled nodes across every chapter.
const labels = {};

// The bib file, the pages file, and the output directory are the first three
// command line arguments, followed by the chapter files in book order, which
// determines the pages' weights. Bibliography entries are keyed by citation
// key and parsed minimally: only the fields citations in running text need,
// since the reference list itself is rendered by the references shortcode,
// which reads the bib file through Zola's load_data. Unresolved keys render
// bold, mirroring the print draft.
const USAGE = 'usage: convert.js <bibfile> <pagesfile> <outdir> <chapters...>';
const [bibsrc, pagesfile, outdir] = process.argv.slice(2);
if (!bibsrc || !fs.existsSync(bibsrc)) throw new Error(`${USAGE}: no bib file at ${bibsrc}`);
if (!pagesfile || !fs.existsSync(pagesfile)) throw new Error(`${USAGE}: no pages file at ${pagesfile}`);
if (!outdir || !fs.existsSync(outdir)) throw new Error(`${USAGE}: no output directory at ${outdir}`);
// the pages file is written by the book's build, one "Title page" line per
// chapter giving the physical page its heading lands on in the PDF, which
// the site's PDF links target; chapters are matched to it by title. The PDF
// itself sits beside the pages file, and is copied to static/book.pdf in the
// same run, so the page numbers can never drift from the deployed PDF
const pdfsrc = pagesfile.replace(/\.pages\.txt$/, '.pdf');
if (pdfsrc === pagesfile || !fs.existsSync(pdfsrc)) throw new Error(`${USAGE}: no book PDF at ${pdfsrc}`);
fs.copyFileSync(pdfsrc, path.resolve(outdir, '..', '..', 'static', 'book.pdf'));
const pages = new Map(fs.readFileSync(pagesfile, {encoding: 'utf8'}).trim().split('\n').map(line => {
    const i = line.lastIndexOf(' ');
    return [line.slice(0, i), parseInt(line.slice(i + 1), 10)];
}));
// the bib is copied into static, where Zola both serves it verbatim for
// machine readers and reads it through the references shortcode's
// load_data, which needs an in-tree path
const bibfile = 'static/md/BDMA.bib';
const bibdest = path.resolve(outdir, '..', '..', bibfile);
fs.mkdirSync(path.dirname(bibdest), {recursive: true});
fs.copyFileSync(bibsrc, bibdest);
const bib = {};
fs.readFileSync(bibdest, {encoding: 'utf8'}).replace(/@(\w+)\{([^,]+),([^@]*)/g, (m, type, key, body) => {
    const field = name => (body.match(new RegExp(`\\b${name}\\s*=\\s*\\{([^}]*)\\}`)) || [])[1];
    bib[key.trim()] = {authors: field('author').split(' and '), year: field('year')};
});

const BLOCK_RULES = [
    // enter the document at \begin{document}
    ['preamble', /^\\begin\{document\}$/,
        (m, s) => {
            s.mode = 'document';
        }],

    // drop all other preamble lines
    ['preamble', /^/,
        () => {}],

    // stop at \end{document}
    ['document', /^\\end\{document\}$/,
        (m, s) => {
            s.mode = 'done';
        }],

    // drop everything after \end{document}
    ['done', /^/,
        () => {}],

    // a paragraph break, at which pending margin notes and footnote
    // definitions flush during emission
    ['document', /^$/,
        (m, s) => s.add({t: 'break'})],

    // \chapter becomes the page title and the top-level heading, and a
    // starred \chapter an unnumbered one, used by the front matter chapters
    // and the appendix; a chapter label's landing point is the whole page,
    // so its node carries an empty anchor
    ['document', /^\\chapter(\*)?\{(.*)\}$/,
        (m, s) => {
            s.title = m[2];
            s.chapter = m[1] ? null : String(s.number);
            s.slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            s.url = `/chapters/${s.slug}/`;
            s.ref = {t: 'chapter', title: m[2], refKind: 'Chapter', number: s.chapter, id: ''};
            s.add(s.ref);
        }],

    // \section becomes a heading, with the section() shortcode marking the
    // section boundary for the menu scrollspy
    ['document', /^\\section\{(.*)\}$/,
        (m, s) => {
            s.sec++;
            s.subsec = 0;
            const number = s.alpha ? String.fromCharCode(64 + s.sec) : `${s.chapter}.${s.sec}`;
            s.ref = {t: 'section', refKind: s.alpha ? 'Appendix' : 'Section', number, title: m[1], id: '', no: s.lineNo};
            s.section = s.ref;
            s.add(s.ref);
        }],

    // \section* becomes an unnumbered heading, still marking a scrollspy
    // section boundary
    ['document', /^\\section\*\{(.*)\}$/,
        (m, s) => {
            s.ref = {t: 'section', refKind: 'Section', number: null, title: m[1], id: '', no: s.lineNo};
            s.add(s.ref);
        }],

    // xltabular becomes a Markdown table: each row is & -separated cells
    // ending in \\, and a \labelcpageref cell renders as a section-number
    // link to where the notation is introduced (placeholder until the
    // ntn: labels are resolved)
    ['document', /^\\begin\{xltabular\}\{[^}]*\}\{.*\}$/,
        (m, s) => {
            s.table = [];
            s.mode = 'table';
        }],
    ['table', /^\\end\{xltabular\}$/,
        (m, s) => {
            s.add({t: 'table', rows: s.table, no: s.lineNo});
            s.mode = 'document';
        }],
    ['table', /^/,
        (m, s) => {
            if (!s.line.endsWith('\\\\')) throw new Error(`${s.file}:${s.lineNo}: table row does not end in \\\\`);
            s.table.push(s.line.slice(0, -2).trim().split(' & '));
        }],

    // \subsection becomes a heading, which has no anchor to land on, so a
    // label following it fails at parse time
    ['document', /^\\subsection\{(.*)\}$/,
        (m, s) => {
            const number = `${s.alpha ? String.fromCharCode(64 + s.sec) : s.chapter + '.' + s.sec}.${++s.subsec}`;
            s.ref = {t: 'subsection', number, title: m[1], no: s.lineNo};
            s.section = s.ref;
            s.add(s.ref);
        }],

    // \htmldescription supplies the chapter's summary, processed by the
    // inline rules like prose at emit time; it is rendered on the homepage
    // table of contents and stripped to plain text for the meta description;
    // its argument may span several lines, which are joined with spaces
    ['document', /^\\htmldescription\{(.*)$/,
        (m, s) => {
            s.description = '';
            s.mode = 'description';
            describe(m[1], s);
        }],
    ['description', /^/,
        (m, s) => describe(s.line, s)],

    // the htmlunderconstruction environment marks a chapter stub: the web
    // edition renders a standard notice in its place, and anything inside
    // the environment is dropped, as if commented out
    ['document', /^\\begin\{htmlunderconstruction\}\{(.*)\}$/,
        (m, s) => {
            s.add({t: 'text', line: `🚧 ${m[1]} 🚧`, no: s.lineNo});
            s.mode = 'construction';
        }],
    ['construction', /^\\end\{htmlunderconstruction\}$/,
        (m, s) => {
            s.mode = 'document';
        }],
    ['construction', /^/,
        () => {}],

    // \paragraph becomes a bold run-in heading joined to the following paragraph
    ['document', /^\\paragraph\{(.*)\}$/,
        (m, s) => s.add({t: 'paragraph', title: m[1], no: s.lineNo})],

    // ntn: labels mark where notation is introduced, for the notation
    // chapter's reference column; several may stack at one spot, and each
    // binds to the innermost enclosing section or subsection, whose
    // number the column displays
    ['document', /^\\label\{(ntn:[^}]*)\}$/,
        (m, s) => {
            if (!s.section) throw new Error(`${s.file}:${s.lineNo}: ${m[1]} is not inside a section`);
            (s.section.ntn ??= []).push(m[1]);
        }],

    // a block-level label names the most recently parsed construct, which
    // must be able to carry an id for references to land on
    ['document', /^\\label\{(.*)\}$/,
        (m, s) => {
            if (!s.ref || !s.ref.refKind) throw new Error(`${s.file}:${s.lineNo}: label ${m[1]} does not follow a construct that can carry an id`);
            if (s.ref.labelName) throw new Error(`${s.file}:${s.lineNo}: second label ${m[1]} on ${s.ref.refKind} ${s.ref.number}`);
            s.ref.labelName = m[1];
            if (s.ref.refKind !== 'Chapter') s.ref.id = m[1].replace(/[^a-zA-Z0-9]+/g, '-');
        }],

    // the appendix switches its sections to letters, and its table of
    // contents adjustments have no web counterpart
    ['document', /^\\renewcommand\{\\thesection\}\{\\Alph\{section\}\}$/,
        (m, s) => {
            s.alpha = true;
        }],
    ['document', /^\\addcontentsline\{.*\}$/,
        () => {}],
    ['document', /^\\addtocontents\{toc\}\{.*tocdepth.*\}$/,
        (m, s) => {
            s.tocSections = false;
        }],

    // page furniture produces no output
    ['document', /^\\pagenumbering\{.*\}$/,
        () => {}],

    // \[ opens display math, whose contents are buffered until \] so that,
    // mirroring the AVT.sty display dispatch, they can be split into rows and
    // wrapped in align when they contain alignment points or gather when they
    // contain line breaks; contents pass through the math macro expansion
    // as a whole, since macro arguments may span lines, and equation tags
    // are assigned per row at emit time
    ['document', /^\\\[$/,
        (m, s) => {
            s.math = [];
            s.mode = 'displaymath';
        }],
    ['displaymath', /^\\\]$/,
        (m, s) => {
            s.add({t: 'math', ...displayMath(math(s.math.join('\n'), s).split('\n')), indent: s.lists.length, no: s.lineNo});
            s.mode = 'document';
        }],
    ['displaymath', /^/,
        (m, s) => s.math.push(s.line)],

    // theorem-family environments nest their body nodes, so that restatables
    // can replay the whole construct; the bold run-in head and an optional
    // [name] margin note are produced at emit time
    ['document', new RegExp(`^\\\\begin\\{(${THEOREM_KINDS})\\}(?:\\[(.*)\\])?$`),
        (m, s) => beginTheorem(m[1], m[2], s)],

    // restatable is a theorem of its second argument's kind which additionally
    // records its node for replay where its statement macro is later invoked
    ['document', /^\\begin\{restatable\}(?:\[(.*)\])?\{(\w+)\}\{(\w+)\}$/,
        (m, s) => beginTheorem(m[2], m[1], s, m[3])],
    ['document', new RegExp(`^\\\\end\\{(?:${THEOREM_KINDS}|restatable)\\}$`),
        (m, s) => {
            const node = s.envs.pop();
            s.stack.pop();
            if (node.macro) s.restatables[node.macro] = node;
        }],

    // callouts become the callout shortcode, with the star mark and the
    // emphasized body style supplied by the site's CSS
    ['document', /^\\begin\{callout\}$/,
        (m, s) => s.add({t: 'open', lines: ['{% callout() %}']})],
    ['document', /^\\end\{callout\}$/,
        (m, s) => s.add({t: 'close'})],

    // proofs become the proof shortcode with an italic run-in head, and the
    // site's CSS supplies the tombstone at the end of the proof
    ['document', /^\\begin\{proof\}$/,
        (m, s) => s.add({t: 'open', lines: ['{% proof() %}', '*Proof.*']})],
    ['document', /^\\end\{proof\}$/,
        (m, s) => s.add({t: 'close'})],

    // figures become the figure shortcode with a numbered caption, keeping
    // only the caption and any included graphic, whose pdf name in the TeX
    // maps to a same-named svg placed by hand in the static figures directory
    ['document', /^\\begin\{figure\*?\}/,
        (m, s) => {
            s.figure = {t: 'figure', refKind: 'Figure', number: `${s.chapter}.${++s.fig}`, caption: '', src: null, id: '', no: s.lineNo};
            s.mode = 'figure';
        }],
    ['figure', /^\\end\{figure\*?\}$/,
        (m, s) => {
            s.add(s.figure);
            s.mode = 'document';
        }],
    ['figure', /^\\label\{(.*)\}$/,
        (m, s) => {
            s.figure.labelName = m[1];
            s.figure.id = m[1].replace(/[^a-zA-Z0-9]+/g, '-');
        }],
    ['figure', /^\\caption\{/,
        (m, s) => {
            const close = matchBrace(s.line, 8, s);
            s.figure.caption = s.line.substring(9, close);
        }],
    ['figure', /^\\includegraphics(?:\[[^\]]*\])?\{figures\/([^}]+)\.pdf\}$/,
        (m, s) => {
            s.figure.src = `/figures/${m[1]}.svg`;
        }],
    ['figure', /^/,
        () => {}],

    // \1..\9 are list items whose digit is the marker, with \1 opening a new
    // list (starred: bulleted); a math-mode \1 is the indicator function,
    // never a list item, which is safe here because display math is
    // mode-gated above and inline math is dollar-delimited and hence cannot
    // place a \1 at the start of a line
    ['document', /^\\([1-9])(\*)?(?:\[(.*)\])?\s?(.*)$/,
        (m, s) => listItem(m[1], m[2], m[3], m[4], s)],

    // \0 closes the innermost list, which must therefore exist; closing a
    // nested list emits the endlist shortcode at the outer item's depth,
    // which ends the inner list without the blank line that would make the
    // outer list loose
    ['document', /^\\0\*?$/,
        (m, s) => {
            if (s.lists.length === 0) throw new Error(`${s.file}:${s.lineNo}: \\0 without an open list`);
            s.lists.pop();
            if (s.lists.length === 0) s.add({t: 'blank'});
            else s.add({t: 'text', line: '{{ endlist() }}', indent: s.lists.length, no: s.lineNo});
        }],

    // \vfill is print-page spacing, which the web layout has no analog of
    ['document', /^\\vfill$/, () => {}],

    // a capitalized macro alone on a line replays a recorded restatable node;
    // since equation tags, footnote numbers, and citation anchors are all
    // assigned at emit time, the replayed body numbers itself correctly; the
    // starred form restates without repeating the name in the margin
    ['document', /^\\([A-Z]\w+)\*?$/,
        (m, s) => s.add({t: 'replay', target: s.restatables[m[1]] || null, line: s.line, no: s.lineNo})],

    // \parmarginnote on its own line is a margin note aligned with the top
    // of the paragraph that follows, positioned statically like a theorem
    // name rather than anchored like an inline \marginnote, so it is
    // queued before that paragraph's first line under its own shortcode,
    // which keeps it out of the anchored notes' numbering
    ['document', /^\\parmarginnote\{(.*)\}$/,
        (m, s) => s.add({t: 'marginnote', text: m[1], no: s.lineNo})],

    // anything else is a prose line, processed by the inline rules at emit
    // time; footnotes cannot be rendered inside a theorem body, and failing
    // here keeps the emit pass free of structural errors; inside a list, the
    // line continues the current item and is indented accordingly at emit time
    ['document', /^/,
        (m, s) => {
            if (s.stack.length > 1 && s.line.includes('\\footnote{')) throw new Error(`${s.file}:${s.lineNo}: footnote inside an environment cannot be rendered`);
            s.add({t: 'text', line: s.line, indent: s.lists.length, no: s.lineNo});
        }],
];

// Math rules are [pattern, replacement] pairs applied only inside math, and
// expand the parameterless AVT.sty macros used by the chapters into standard
// KaTeX input. Parameterized macros are expanded by expandMathMacros below.
const MATH_RULES = [
    [/\\given(?![a-zA-Z])/g, '\\mid'],
    [/\\from(?![a-zA-Z])/g, '\\mid\\mid'],
    [/\\eps(?![a-zA-Z])/g, '\\varepsilon'],
    [/\\R(?![a-zA-Z])/g, '\\mathbb{R}'],
    [/\\N(?![a-zA-Z])/g, '\\mathbb{N}'],
    [/\\Z(?![a-zA-Z])/g, '\\mathbb{Z}'],
    [/\\C(?![a-zA-Z])/g, '\\mathbb{C}'],
    [/\\Cov(?![a-zA-Z])/g, '\\operatorname{Cov}'],
    [/\\E(?![a-zA-Z])/g, '\\operatorname*{\\mathbb{E}}'],
    [/\\P(?![a-zA-Z])/g, '\\operatorname{\\mathbb{P}}'],
    [/\\Var(?![a-zA-Z])/g, '\\operatorname{Var}'],
    [/\\argmax(?![a-zA-Z])/g, '\\operatorname*{\\arg\\max}'],
    [/\\argmin(?![a-zA-Z])/g, '\\operatorname*{\\arg\\min}'],
    [/\\takeaway(?![a-zA-Z])/g, '\\setminus'],
    [/\\x(?![a-zA-Z])/g, '\\times'],
    [/\\grad(?![a-zA-Z])/g, '\\nabla'],
    [/\\d(?![a-zA-Z])/g, '\\mathop{}\\!\\mathrm{d}'],
    [/\\1/g, '\\text{\u{1D7D9}}'],
    [/\\tl(?![a-zA-Z])\s*(\\[a-zA-Z]+|\S)/g, '\\widetilde{$1}'], // brace-less single-token argument

    [/\\~(?:\[([^\]]*)\])?/g, (m, dist) => dist ? `\\sim\\operatorname{${dist}}` : '\\sim '],
    [/\\\./g, '\\cdot '],
    [/\\\+/g, '\\quad '],
    [/\\</g, '&\\hspace{-2em}'],
];

// Paired delimiter macros wrap their argument in delimiters which are
// auto-sized by default and fixed-size when called with an optional [1]-[4].
const MATH_DELIMITERS = {del: ['(', ')'], abs: ['|', '|'], norm: ['\\|', '\\|'], floor: ['\\lfloor', '\\rfloor']};
const MATH_SIZES = {1: 'big', 2: 'Big', 3: 'bigg', 4: 'Bigg'};

// Inline rules are [pattern, replacement] pairs applied in order within prose lines.
// Math is wrapped in backticks first so that later rules never touch its contents.
const INLINE_RULES = [
    [/\\label\{[^}]*\}/g, ''],
    // a trailing \\ becomes a Markdown hard line break
    [/\s*\\\\\s*$/, '\\'],
    [/\\emph\{([^{}]*)\}/g, '*$1*'],
    [/\\textbf\{([^{}]*)\}/g, '**$1**'],
    // the tag's contents remain Markdown, so emphasis characters are escaped
    [/\\textsuperscript\{([^{}]*)\}/g, (m, arg) => `<sup>${arg.replace(/[*_]/g, '\\$&')}</sup>`],
];

// Processes a prose line during emission: footnotes and margin notes are
// extracted into the pending queue, references and citations are resolved,
// and math spans are stashed behind placeholders before the inline rules run
// and restored afterwards, so no textual rule can ever touch math contents.
// The rules are applied repeatedly until a fixed point, which resolves nested
// arguments such as emphasis containing emphasis from the innermost out.
function inline(line, e) {
    let i;
    while ((i = line.indexOf('\\footnote{')) !== -1) {
        const close = matchBrace(line, i + 9, e);
        e.footnotes.push([`[^${++e.fn}]: ${inline(line.substring(i + 10, close), e)}`]);
        line = line.slice(0, i) + `[^${e.fn}]` + line.slice(close + 1);
    }
    while ((i = line.indexOf('\\marginnote{')) !== -1) {
        const close = matchBrace(line, i + 11, e);
        e.notes.push(['{% marginnote() %}', inline(line.substring(i + 12, close), e), '{% end %}']);
        line = line.slice(0, i) + line.slice(close + 1);
    }
    line = line.replace(/\\[cC]ref\{([^}]*)\}/g, (m0, keys) => keys.split(',').map(key => {
        const label = labels[key.trim()];
        if (!label) throw new Error(`${e.file}:${e.lineNo}: unresolved reference ${key.trim()}`);
        return `[${label.kind}${label.number ? ' ' + label.number : ''}](${label.url}${label.anchor ? '#' + label.anchor : ''})`;
    }).join(', '));
    line = line.replace(/\\textcite(?:\[([^\]]*)\])?\{([^}]*)\}/g, (m0, note, keys) => {
        const groups = [];
        for (const key of keys.split(',').map(k => k.trim())) {
            const entry = bib[key];
            const last = groups[groups.length - 1];
            if (entry && last?.entry && entry.authors.join(' and ') === last.entry.authors.join(' and ')) last.works.push({ key, entry });
            else groups.push({ entry, works: [{ key, entry }] });
        }
        return groups.map(({ entry, works }) => {
            if (!entry) {
                console.warn(`${e.file}:${e.lineNo}: missing bibliography entry ${works[0].key}`);
                return `**${works[0].key}**`;
            }
            const surnames = entry.authors.map(a => a.split(',')[0].trim());
            const who = surnames.length === 1 ? surnames[0] : surnames.length === 2 ? `${surnames[0]} and ${surnames[1]}` : `${surnames[0]} et al.`;
            const ns = works.map(({ key }) => {
                const n = (e.cited.get(key) || 0) + 1;
                e.cited.set(key, n);
                return n;
            });
            const list = items => `[${items.join(', ')}]`;
            const text = `${who} (${works.map(w => w.entry.year).join(', ')}${note ? ', ' + note : ''})`;
            return `{% cite(keys=${list(works.map(w => `"${w.key}"`))}, n=${list(ns)}) %}${text}{% end %}`;
        }).join(', ');
    });
    const stash = [];
    let text = line.replace(/\$([^$]+)\$/g, (m, inner) => `\x00${stash.push('`$' + math(inner, e) + '$`') - 1}\x00`);
    let prev = null;
    while (text !== prev) {
        prev = text;
        text = INLINE_RULES.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text);
    }
    if (/`|''/.test(text)) throw new Error(`${e.file}:${e.lineNo}: TeX-style quote in source, but csquotes straight quotes are expected`);
    return text.replace(/\x00(\d+)\x00/g, (m, n) => stash[n]);
}

// Returns the index of the brace matching the opening brace at index i,
// ignoring braces escaped with a backslash. Works for both the parse state
// and the emit context, which expose the same file and lineNo fields.
function matchBrace(text, i, c) {
    let depth = 0;
    for (let j = i; j < text.length; j++) {
        if (text[j - 1] === '\\') continue;
        if (text[j] === '{') depth++;
        if (text[j] === '}' && --depth === 0) return j;
    }
    throw new Error(`${c.file}:${c.lineNo}: unbalanced braces in math`);
}

// Appends a line to the description being collected, and returns to document
// mode once the brace opened by \htmldescription closes; nothing may follow
// the closing brace on its line.
function describe(line, s) {
    s.description += (s.description ? ' ' : '') + line.trim();
    let depth = 1;
    for (let j = 0; j < s.description.length; j++) {
        if (s.description[j - 1] === '\\') continue;
        if (s.description[j] === '{') depth++;
        if (s.description[j] === '}' && --depth === 0) {
            if (s.description.slice(j + 1).trim() !== '') throw new Error(`${s.file}:${s.lineNo}: text after \\htmldescription`);
            s.description = s.description.slice(0, j);
            s.mode = 'document';
            return;
        }
    }
}

// Expands the parameterized AVT.sty math macros, using explicit brace
// matching since their arguments regularly contain nested braces.
function expandMathMacros(text, c) {
    const pattern = /\\(floor|norm|abs|del|ubr|tl|c|f|t)(?:\[(\d)\])?\{/;
    let m;
    while ((m = pattern.exec(text))) {
        const open = m.index + m[0].length - 1;
        const close = matchBrace(text, open, c);
        const arg = text.substring(open + 1, close);
        let replacement;
        let end = close;
        if (m[1] === 'ubr') {
            const close2 = matchBrace(text, close + 1, c);
            replacement = `\\underbrace{${arg}}_{${text.substring(close + 2, close2)}}`;
            end = close2;
        } else if (m[1] in MATH_DELIMITERS) {
            const [left, right] = MATH_DELIMITERS[m[1]];
            const size = MATH_SIZES[m[2]];
            replacement = size ? `\\${size}l${left} ${arg} \\${size}r${right}` : `\\left${left} ${arg} \\right${right}`;
        } else {
            replacement = {c: `\\mathcal{${arg}}`, f: `\\operatorname{${arg}}`, t: `\\mathrel{\\text{${arg}}}`, tl: `\\widetilde{${arg}}`}[m[1]];
        }
        text = text.slice(0, m.index) + replacement + text.slice(end + 1);
    }
    return text;
}

// The aligned-overset package allows \\overset{label}&rel, placing the label
// on the relation at an alignment point; standard KaTeX needs &\\overset{label}{rel}.
function expandAlignedOverset(text, c) {
    let from = 0;
    while (true) {
        const i = text.indexOf('\\overset{', from);
        if (i === -1) return text;
        const close = matchBrace(text, i + 8, c);
        if (text[close + 1] !== '&') {
            from = close;
            continue;
        }
        const rel = text.slice(close + 2).match(/^(?:\\[a-zA-Z]+|=)/);
        if (!rel) throw new Error(`${c.file}:${c.lineNo}: aligned-overset without a relation`);
        text = text.slice(0, i) + '&\\overset' + text.slice(i + 8, close + 1) + '{' + rel[0] + '}' + text.slice(close + 2 + rel[0].length);
    }
}

// Expands the AVT.sty macros in a math span into standard KaTeX.
function math(text, c) {
    text = expandMathMacros(text, c);
    text = expandAlignedOverset(text, c);
    return MATH_RULES.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text);
}

// Splits buffered display math into rows at outer line breaks, tracking the
// nesting depth of inner environments such as cases so their breaks and
// alignment points are not mistaken for the display's own, and chooses the
// align or gather wrapper following the AVT.sty display dispatch.
function displayMath(lines) {
    const rows = [[]];
    let depth = 0;
    let outerAmp = false;
    let outerBreak = false;
    for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
            if (line.startsWith('\\begin{', i)) depth++;
            if (line.startsWith('\\end{', i)) depth--;
            if (line[i] === '&' && depth === 0) outerAmp = true;
        }
        if (depth === 0 && line.endsWith('\\\\')) {
            outerBreak = true;
            const content = line.slice(0, -2).trimEnd();
            if (content) rows[rows.length - 1].push(content);
            rows.push([]);
        } else {
            rows[rows.length - 1].push(line);
        }
    }
    if (rows[rows.length - 1].length === 0) rows.pop();
    return {rows, env: outerAmp ? 'align' : outerBreak ? 'gather' : null};
}

function listItem(digit, star, label, rest, s) {
    if (label !== undefined && label !== '--') throw new Error(`${s.file}:${s.lineNo}: unhandled list item label [${label}]`);
    if (digit === '1') s.lists.push({type: star ? 'bullet' : 'number'});
    if (s.lists.length === 0) throw new Error(`${s.file}:${s.lineNo}: list item outside list`);
    if (s.stack.length > 1 && rest.includes('\\footnote{')) throw new Error(`${s.file}:${s.lineNo}: footnote inside an environment cannot be rendered`);
    const marker = s.lists[s.lists.length - 1].type === 'bullet' ? '-' : `${digit}.`;
    s.add({t: 'item', indent: s.lists.length - 1, marker, text: rest, no: s.lineNo});
}

function beginTheorem(kind, name, s, macro) {
    const refKind = kind.charAt(0).toUpperCase() + kind.slice(1);
    const number = kind === 'exercise' ? `${s.chapter}.${++s.ex}` : `${s.chapter}.${++s.thm}`;
    const node = {t: 'theorem', kind, refKind, number, name, macro, id: '', body: [], no: s.lineNo};
    s.ref = node;
    s.add(node);
    s.envs.push(node);
    s.stack.push(node.body);
}

// The parse pass: reads a chapter file and returns its state, whose nodes
// field holds the parsed node list. Comments are stripped, and lines emptied
// by comment stripping do not count as paragraph breaks.
function parseFile(p) {
    const name = path.basename(p, '.tex');
    const s = {
        mode: 'preamble',
        name,
        file: p,
        title: null,
        number: parseInt(name),
        chapter: null,
        slug: null,
        url: null,
        description: null,
        ref: null,
        section: null,
        alpha: false,
        tocSections: true,
        sec: 0,
        subsec: 0,
        thm: 0,
        ex: 0,
        fig: 0,
        envs: [],
        lists: [],
        restatables: {},
        nodes: [],
        stack: null,
        line: null,
        add(node) { this.stack[this.stack.length - 1].push(node); },
    };
    s.stack = [s.nodes];
    fs.readFileSync(p, {encoding: 'utf8'})
        .split('\n')
        .forEach(
            (raw, i) => {
                const line = raw.replace(/(?<!\\)%.*$/, '').trimEnd();
                // a comment-only line is no paragraph break, since TeX's %
                // consumes the newline, but a whitespace-only line is one
                if (line === '' && raw.trim() !== '') return;
                s.line = line;
                s.lineNo = i + 1;
                const [, pattern, action] = BLOCK_RULES.find(([mode, pattern]) => mode === s.mode && pattern.test(line));
                action(line.match(pattern), s);
            }
        );
    if (s.title === null) throw new Error(`${p}: no \\chapter found`);
    return s;
}

// The collect pass: harvests every labeled node into the cross-reference
// table, so that references across chapters resolve. A labeled section's
// anchor is the id Zola derives from its heading text, so the section
// element itself needs no id of its own.
function collect(states) {
    const walk = (nodes, url) => {
        for (const node of nodes) {
            const anchor = node.t === 'section' || node.t === 'subsection'
                ? `${node.number ? node.number + '. ' : ''}${node.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                : node.id;
            if (node.labelName) labels[node.labelName] = {kind: node.refKind, number: node.number, url, anchor};
            for (const name of node.ntn ?? []) labels[name] = {kind: node.refKind, number: node.number, url, anchor};
            if (node.body) walk(node.body, url);
        }
    };
    for (const s of states) walk(s.nodes, s.url);
}

// Flushes the notes queued by inline() at the current paragraph break:
// margin notes are spliced in before the paragraph that produced them, so
// that their static position aligns them with its top, while footnote
// definitions are appended after it.
function flushPending(e) {
    const spliced = e.notes.flatMap(block => [...block, '']);
    e.out.splice(e.paraStart ?? e.out.length, 0, ...spliced);
    for (const block of e.footnotes) {
        e.emit(...block);
        e.blank();
    }
    e.notes = [];
    e.footnotes = [];
}

// The serializers of the emit pass, one per node type, each producing the
// node's Markdown through the emit context, which collapses blank runs and
// carries the per-emission counters.
const SERIALIZERS = {
    break: (node, e) => {
        e.blank();
        flushPending(e);
        e.paraStart = null;
    },
    blank: (node, e) => e.blank(),
    chapter: (node, e) => {
        e.emit(`# ${node.title}`);
        e.blank();
    },
    section: (node, e) => {
        e.blank();
        e.emit('{{ section() }}', '', `## ${node.number ? node.number + '. ' : ''}${inline(node.title, e)}`);
        e.blank();
    },
    subsection: (node, e) => {
        e.blank();
        e.emit(`### ${node.number}. ${inline(node.title, e)}`);
        e.blank();
    },
    paragraph: (node, e) => {
        e.blank();
        e.paraStart ??= e.out.length;
        e.emit(`**${inline(node.title, e)}.**`);
    },
    math: (node, e) => {
        e.paraStart ??= e.out.length;
        const body = [];
        node.rows.forEach((row, i) => {
            body.push(...row, `\\tag{${e.chapter}.${++e.eq}}`);
            if (i < node.rows.length - 1) body.push('\\\\');
        });
        const pad = '    '.repeat(node.indent ?? 0);
        e.emit(...['```', '$$', ...node.env ? [`\\begin{${node.env}}`, ...body, `\\end{${node.env}}`] : body, '$$', '```'].map(l => pad + l));
    },
    // an exercise carries its name in the run-in head, as in the TeX,
    // rather than in the margin
    theorem: (node, e) => {
        e.blank();
        const exercise = node.kind === 'exercise';
        const args = [
            ...node.id ? [`id="${node.id}"`] : [],
            `kind="${node.kind}"`,
            ...node.name && !exercise ? [`name="${inline(node.name, e)}"`] : [],
        ];
        const head = exercise ? node.number : `${node.refKind} ${node.number}`;
        const note = exercise && node.name ? ` (${inline(node.name, e)})` : '';
        e.emit(`{% theorem(${args.join(', ')}) %}`, `**${head}${note}.**`);
        node.body.forEach(child => SERIALIZERS[child.t](child, e));
        e.trim();
        e.emit('{% end %}');
        e.blank();
    },
    open: (node, e) => {
        e.blank();
        e.emit(...node.lines);
    },
    close: (node, e) => {
        e.trim();
        e.emit('{% end %}');
        e.blank();
    },
    figure: (node, e) => {
        const id = node.id ? `id="${node.id}", ` : '';
        e.blank();
        e.emit(`{% figure(${id}src="${node.src ?? ''}", alt="Figure ${node.number}", dark_invert=true) %}`, `**Figure ${node.number}.** ${inline(node.caption, e)}`, '{% end %}');
        e.blank();
    },
    // rows render as a GFM table; alignment is left to the site's CSS
    table: (node, e) => {
        e.blank();
        const cols = Math.max(...node.rows.map(r => r.length));
        // the header row is hidden by the site's CSS, but is populated so
        // that readers of the raw HTML find column names
        e.emit(`| ${['Symbol', 'Description', 'Link'].slice(0, cols).join(' | ')} |`, `|${' --- |'.repeat(cols)}`);
        for (const row of node.rows) {
            // the reference column links to the section where the notation
            // is introduced, in place of the print edition's page number
            const cells = row.map(cell => inline(cell.replace(/\\labelcpageref\{([^}]*)\}/g, (m0, key) => {
                const label = labels[key.trim()];
                if (!label) throw new Error(`${e.file}:${e.lineNo}: unresolved reference ${key.trim()}`);
                return `[${label.number}](${label.url}#${label.anchor})`;
            }), e));
            e.emit(`| ${cells.join(' | ')} |`);
        }
        e.blank();
    },
    item: (node, e) => {
        e.paraStart ??= e.out.length;
        e.emit('    '.repeat(node.indent) + `${node.marker} ${inline(node.text, e)}`);
    },
    // a replayed theorem keeps its number but not its id, which must be
    // unique on the page: the restatement gets a -restate suffix, and
    // references land on the original statement; its name is not repeated
    replay: (node, e) => {
        e.blank();
        if (node.target) SERIALIZERS.theorem({...node.target, name: undefined, id: node.target.id && `${node.target.id}-restate`}, e);
        else e.emit(inline(node.line, e));
    },
    marginnote: (node, e) => {
        e.paraStart ??= e.out.length;
        e.notes.push(['{% parmarginnote() %}', inline(node.text, e), '{% end %}']);
    },
    text: (node, e) => {
        e.paraStart ??= e.out.length;
        e.emit('    '.repeat(node.indent ?? 0) + inline(node.line, e));
    },
};

// The emit pass: serializes a parsed chapter's nodes to Markdown, appends the
// reference list and the footnotes heading, and writes the page with its
// front matter.
function emitFile(s) {
    const e = {
        file: s.file,
        chapter: s.chapter,
        lineNo: 0,
        eq: 0,
        fn: 0,
        notes: [],
        footnotes: [],
        paraStart: null,
        cited: new Map(),
        out: [],
        emit(...lines) { this.out.push(...lines); },
        blank() { if (this.out.length > 0 && this.out[this.out.length - 1] !== '') this.out.push(''); },
        trim() { while (this.out.length > 0 && this.out[this.out.length - 1] === '') this.out.pop(); },
    };
    for (const node of s.nodes) {
        e.lineNo = node.no ?? e.lineNo;
        SERIALIZERS[node.t](node, e);
    }
    flushPending(e);
    if (e.cited.size > 0) {
        e.blank();
        const keys = [...e.cited.keys()].sort((a, b) => bib[a].authors[0].localeCompare(bib[b].authors[0]));
        e.emit('{{ section() }}', '', '## References', '', `{{ references(bibfile="${bibfile}", keys=[${keys.map(k => `"${k}"`).join(', ')}], counts=[${keys.map(k => e.cited.get(k)).join(', ')}]) }}`);
    }
    if (e.fn > 5) throw new Error(`${s.file}: ${e.fn} footnotes exceed the $footnote-count anchor rules in _variables.scss`);
    const mn = e.out.filter(l => l.includes('{% marginnote() %}')).length;
    if (mn > 5) throw new Error(`${s.file}: ${mn} margin notes exceed the $marginnote-count anchor rules in _variables.scss`);
    const page = pages.get(s.title);
    if (page === undefined) throw new Error(`${s.file}: chapter "${s.title}" not found in ${pagesfile}, which may be stale`);
    const frontMatter = [
        '+++',
        `title = "${s.title}"`,
        ...s.description ? [`description = "${inline(s.description, e).replace(/[\\"]/g, '\\$&')}"`] : [],
        `slug = "${s.slug}"`,
        `weight = ${s.weight}`,
        '[extra]',
        `page = ${page}`,
        '+++',
        ''
    ];
    const target = path.join(outdir, s.name + '.md');
    fs.writeFileSync(target, frontMatter.concat(e.out).join('\n').trimEnd() + '\n');
    console.log(`${s.file} -> ${target}`);
}

// Parse every chapter given on the command line, whose order is the book
// order and hence supplies the pages' weights, collect the cross-reference
// table across all of them, then emit each one.
const states = process.argv.slice(5).map((p, i) => {
    const s = parseFile(p);
    s.weight = i + 1;
    return s;
});
collect(states);
states.forEach(emitFile);
