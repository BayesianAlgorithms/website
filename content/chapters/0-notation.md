+++
title = "Notation"
slug = "notation"
weight = 2
[extra]
page = 11
+++

# Notation

{{ section() }}

## General

| Symbol | Description |
| --- | --- |
| `$\mathbb{N}$` | Natural numbers, not including zero |
| `$\mathbb{Z}$` | Integers |
| `$\mathbb{R}$` | Real numbers |
| `$\mathbb{C}$` | Complex numbers |
| `$\mathbb{R}^d$` | Euclidean space of dimension `$d$` |
| `$\mathbb{R}^X$` | Space of functions from `$X$` to `$\mathbb{R}$` |
| `$C(X;\mathbb{R})$` | Space of continuous real-valued functions |
| `$[N]$` | Finite set of all integers from `$1$` to `$N$` |
| `$\oplus$` | Disjoint union of sets, concatenation of sequences |
| `$\text{𝟙}_{(\cdot )}$` | Indicator function |
| `$\mathcal{O}(\cdot )$` | Asymptotic upper bound |
| `$\Omega(\cdot )$` | Asymptotic lower bound |
| `$\Theta(\cdot )$` | Asymptotic upper and lower bound |

{{ section() }}

## Probability

| Symbol | Description | Link |
| --- | --- | --- |
| `$(\Omega,\mathcal{F},\operatorname{\mathbb{P}})$` | Probability space | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\sim $` | Distribution of a random variable | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname*{\mathbb{E}}(\cdot )$` | Expectation of a random variable | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{Var}(\cdot )$` | Variance of a random variable | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{Cov}(\cdot ,\cdot )$` | Covariance between two random variables | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname*{\mathbb{E}}(\cdot \mid\cdot )$` | Conditional expectation | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\mathcal{M}_1(X)$` | Space of probability measures over `$X$` | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\mathcal{M}_1(Y\mid X)$` | Space of probability kernels over `$Y$` given `$X$` | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\delta_x$` | Dirac measure centered at `$x$` | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{N}(\mu,\sigma^2)$` | Normal distribution | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{U}(X)$` | Uniform distribution over `$X$` | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{Ber}(p)$` | Bernoulli distribution | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$\operatorname{Bin}(n,p)$` | Binomial distribution | [A.1](/chapters/appendix/#a-1-probability-theory) |
| `$D_{\operatorname{KL}}(\cdot \mid\mid\cdot )$` | Kullback--Leibler divergence | [A.2](/chapters/appendix/#a-2-information-theory) |
| `$I(\cdot ;\cdot )$` | Mutual information | [A.2](/chapters/appendix/#a-2-information-theory) |

{{ section() }}

## Markov Decision Processes

| Symbol | Description | Link |
| --- | --- | --- |
| `$\mathcal{S}$` | State space | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$\mathcal{A}$` | Action space | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$r$` | Reward function | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$p$` | Transition kernel | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$\gamma$` | Discount factor | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$s_0$` | Initial state | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$\pi$` | Policy | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$\Pi$` | Space of policies | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$V^{(\pi)}(\cdot )$` | Value function under policy `$\pi$` | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$V^*(\cdot )$` | Optimal value function | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |
| `$\pi^*$` | Optimal policy | [A.3](/chapters/appendix/#a-3-markov-decision-processes) |

{{ section() }}

## Episodic Decision Problems

| Symbol | Description | Link |
| --- | --- | --- |
| `$A$` | Action space | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$\mathcal{R}$` | Reward function class | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$r$` | True reward function | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$q$` | Reward distribution in the Bayesian variant | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$r_t$` | Sequence of true rewards in the adversarial variant | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$\Sigma$` | Observation space | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$\sigma$` | Feedback function | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$a_t, \sigma_t$` | Action played and feedback observed in episode `$t$` | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$x_{1:t}$` | Sequence from `$x_1$` to `$x_t$` | [2.1](/chapters/decision-making-under-uncertainty/#2-1-definitions-and-basic-examples) |
| `$\operatorname{Seq}(X)$` | Space of finite-length sequences over `$X$` | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$p$` | Algorithm for an episodic decision problem | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$\mathcal{P}$` | Space of algorithms | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$R_T(p,r)$` | Cumulative regret | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |
| `$r_T(p,r)$` | Simple regret | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |
| `$r_c(p,r)$` | Cost-adjusted simple regret | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |
| `$R_T(p,q)$` | Bayesian regret | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |
| `$V^*_{\operatorname{MDP}}$` | Optimal value of the underlying MDP of a Bayesian variant | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |
| `$\preceq$` | Blackwell order over feedback functions | [2.3](/chapters/decision-making-under-uncertainty/#2-3-evaluating-performance-via-regret) |

{{ section() }}

## Bayesian Models and Algorithms

| Symbol | Description | Link |
| --- | --- | --- |
| `$p_\theta$` | Prior distribution for `$\theta$` | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$p_{y\mid\theta}$` | Likelihood for `$y$` given `$\theta$` | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$p_{\theta\mid y}$` | Posterior distribution for `$\theta$` given `$y$` | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$\delta$` | Decision rule | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
| `$\alpha$` | Acquisition function | [2.2](/chapters/decision-making-under-uncertainty/#2-2-algorithms-for-decision-making) |
