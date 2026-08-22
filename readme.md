# Bayesian Decision-making Algorithms

This repository contains the companion web version of the [Bayesian Decision-making Algorithms](https://bayesianalgorithmc.com) book, which has been built with the [designed to last](https://jeffhuang.com/designed_to_last/) philosophy in mind.

The build pipeline is as follows:
1. Convert the TeX source to Markdown using a Node script.[^1]
2. Build the HTML site using [Zola](https://getzola.org/).
3. Render all math server-side using [KaTeX](https://katex.org/) with a small helper script.

For copyright reasons, this repository does not accept pull requests directly. If you find an error or other issue with the book, please file a [GitHub issue](https://github.com/BayesianAlgorithms/website/issues/).

[^1]: The designed-to-last philosophy does not extend to this script, which very much relies on an approach where only final output is verified rather than intermediate logic.