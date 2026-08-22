+++
title = "Introduction"
description = "Before beginning our journey, we motivate our topic of *decision-making under uncertainty* quantified by a *stochastic model*. We introduce the core question of how to use the model's uncertainty to balance *explore-exploit tradeoffs*---those between picking known good actions, and trying out new actions in order to learn."
slug = "introduction"
weight = 3
[extra]
page = 15
+++

# Introduction

Making decisions in the face of uncertainty is a ubiquitous part of life and intelligent behavior.
To illustrate this, let us start with perhaps the most immediate example possible: your experience in deciding to open and read this book.
Perhaps you've got a question in mind: for instance, *how does the Thompson sampling algorithm work?*
Or, you might've learned about a class of techniques, such as upper confidence bounds, and started to wonder, *what else is possible?*
Either way, time is finite, so you will likely have opened this book in pursuit of a goal.

In seeking the answers to these questions, there are different actions you could have chosen to take.
The first of these will likely have been to glance at the table of contents---followed, perhaps, by reading this introduction.
Or, you might've jumped straight to one of the chapters of interest---in this case, you likely made it to this introduction much later.
Was your use of time in pursuing the question of interest effective?
From a fundamental perspective, how can we tell?

*Uncertainty* is a central part of studying questions such as these.
Before reading this book, you will not have known its precise contents in full.
Thus, understanding what parts to read would have involved gathering information: *is a particular chapter relevant?*
*Should I read it in careful detail?*
One can think of the action of skimming a chapter as something like spending a small amount of time to reduce uncertainty about its contents.

Note that uncertainty is a property of your mind's *model* of the book's contents, and not of those contents alone.
A data scientist who has implemented bandit algorithms in production systems at a tech company will likely bring a very different profile of uncertainty compared to a student learning about them for the first time.
We will reason about such differences through the lens of *Bayesian learning*, applying conditional probability to assess and propagate uncertainty about the quantities of interest.

In essentially all non-trivial cases, a consequence of uncertainty is the emergence of *explore-exploit tradeoffs*---that is, of tradeoffs between gathering new information, and using the information you've already gathered to achieve your goals.
Continuing our example, if you've skimmed one chapter and it looks relevant, should you spend the effort to read it carefully, or first skim the next one, in case it might be even-more-relevant?
How does one achieve the right balance between these options?
What levels of performance are possible?

This book's goal is to develop a systematic understanding of such questions and how to think about them.
We will begin by formalizing the concept of *decision-making under uncertainty*.
A crucial part of this will be to consider: *what would you have learned instead if you had taken other actions?*
And, closely-related: *how well did you do, compared to what you would have done if you knew everything from the beginning and there was no uncertainty?*
We will see that problems can have different difficulties, and study how to tell whether an algorithm works or not.

With a mathematical understanding of the problem structure in place, we will survey and develop an understanding of every major class of decision-making algorithms.
The emphasis will be on the *definitions*, not proofs or analysis techniques: for each algorithm class, we will follow the simplest path by which one can conclude that it makes technical sense.
In some cases, this will be by first-principles derivation, in others, by positing an algorithm and then analyzing it.
We will aim to achieve a comprehensive overview of the algorithmic landscape.

A critical part of this will be to work at the *right level of generality*: we will not be afraid of considering abstract formulations, but will also never dive into abstractions for their own sake, and will back our definitions up with appropriate sets of concrete examples.
In doing so, we will not only see that decision-making admits a clean and elegant mathematical picture, but that this picture can provide a precise form to a much broader set of practical phenomena than are otherwise understood to have a central origin.

To this end, we will focus on fundamentals and not on applications, of which there are many.
Decision-making, in our general sense, has been discovered and re-discovered in many disciplines, ranging from robotics to psychology, to medicine, to economics, to machine learning and artificial intelligence---our primary domain of interest.
The need for a comprehensive and unified way to think about explore-exploit tradeoffs in large language models, and in artificial intelligence more broadly, is a major motivating force behind this book.

In machine learning and artificial intelligence, all of the ideas in this book are known---but not in a unified way that makes their scope of applicability clear.
Large language models are conditional distributions over the space of tokens---yet, it is not widely appreciated that Bayesian decision-making provides a clean and natural formalism for studying in-context sample-efficient learning.
We hope this book inspires new ways of understanding artificial intelligence systems, and thereby helps ensure they broadly benefit humanity.

With this in mind, let us begin---by casting into mathematics the example of you, the reader, choosing to open this book and read its pages.
