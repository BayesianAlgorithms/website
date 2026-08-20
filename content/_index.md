+++
title = "Bayesian Decision-making Algorithms"
description = "A book about the mathematics of decision-making under uncertainty, explore-exploit tradeoffs, and how to resolve them algorithmically"
template = "index.html"
[extra]
cover = "cover.svg"
+++

# Contents

{{ table_of_contents() }}

# Recent Updates

This monograph is a work-in-progress, and is being written in public.
The current version was compiled on {{ today() }}.
The most recent major addition was the quiet launch of the website.
To receive updates when new content is added, please subscribe to the [mailing list](/email/).

# Contact

You can contact me via [email](https://avt.im/) or [social](https://twitter.com/avt_im/) [media](https://www.linkedin.com/in/aterenin/) for feedback, questions, and suggestions.
Please open a [GitHub issue](https://github.com/bayesianalgorithms/website/issues/) if you find any errors, whether related to the book's technical content, or how it is rendered in any of the available formats.

# Citation

To cite the book, please use the following BibTeX entry:

```bibtex
@book{terenin2026,
  title = {Bayesian Decision-making Algorithms},
  author = {Alexander Terenin},
  year = {2026},
}
```

# Code

Code is available in two GitHub repositories:
- Reference implementation for benchmarks: {{ github(repo="BayesianAlgorithms/benchmarks") }}
- The website's TeX-to-MD-to-HTML pipeline: {{ github(repo="BayesianAlgorithms/website") }}