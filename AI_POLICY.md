# AI Policy for development of INVESTIGATOR

This document is 100% written by a human, and serves two purposes: 1. to let people know how AI us used in developing INVESTIGATOR; 2. to help prospective contributors understand what is and isn't okay.

## Headline

- Using AI to generate code: Good.
- Using it for anything that replaces human creativity: Bad.
- Also, we stick to [Foundry VTT's AI Content Policy](https://foundryvtt.com/article/ai-policy/).

## In more words

Using agentic AI for software development is, whether we like it or not, very very effective, and it's becoming standard practice. It's the one area where AI has unequivocaly proven it's ability. That said, using generative AI for anything else is still very unproven, and the models have almost certainly (in my opionion) been trained of stolen IP. Using those models to produce words, pictures or music, a creative role, is bad.

## Why I use AI

I have finite free time. I love maintaining INVESTIGATOR, and I hope I will keep doing so for a long time, including writing code by hand. But I can't deny the speed boost from getting an AI to hammer out code for me.

For example: as of writing, I have just been adding a BUNCH of code to support Fall of Delta Green's raft of special rules for combat. This was one of the oldest feature requests, dating from 2021. I'd looked at it several times over the years and always had to put it aside because there was no good way to break it up, and it was going to take weeks of effort.

Don't get me wrong, I've already put months of effort, possibly years at this point, into INVESTIGATOR. I don't mind effort. But it has to be fun effort if nobody's paying me, and frankly, fiddly-faffy combat rules are not my bag. So ticket #51 sat there unheeded for five years.

Now, I have a FoDG campaign looming - I have the incentive to add these rules in, but not the time. But What I could do is write up the rules we want to implement, hand that to an AI, plan out the approach, correct a handful of misconceptions, and set it to work. After five days of on-and-off effort, all those new features are implemented. This is unequivocally good!

I have read all the generated code. Is it perfect? No. But then again my own hand-coded effort, with no code reviewers and limited time, would have been far from perfect too. And importantly, I am _confident_ in the generated code. I believe that it does what it sets out to do. An honestly, AI is way better about writing automated tests than I am.

## How I use AI

The technical details here may go stale; this is right as of writing.

I work on one project at a time. I'm not churning multiple project with different agents. I prompt [Claude](https://claude.com/), chat with it to work out any ambiguities or misconceptions, then set it to work. Once it's finished, I test the results and ask for changes, if needed. Then I either read the code or I don't: I read it if it's touching core, architectural parts of the project. If it's pure display logic, I'm satisfied if it functions. Finally I post the changes as a pull request, whereupon two other bots come along and perform code reviews. Sometimes I will resolve their submission immediately. Then I get my original agent to read the PR and work on the comments it finds. Then we merge.

## About code quality

A frequent comment about AI-written code is that it's "slop", "junior dev level" etc. Here's the thing: I am a senior developer/team lead/architect with 20+ years of professional experience, a degree in computer science, and a childhood shaped by hacking code starting with a Sinclair ZX-80 _and believe me, I am perfectly capable of writing sloppy, buggy code on my own. AI didn't invent that._

What I'm saying is that yes, AI can write bad code. But it often writes good code too. And it's remarkably good at picking up mistakes. The results come from an experienced human collaborating with an AI.

## Code submissions

I have always welcomed PRs, and if I'm getting an AI to write code for me, I allow submittors to do the same. I only ask that you:

- Submit code which is reasonably high quality, and works. If you don't know how to check either of those things, please don't submit. That goes for non-AI-assisted submissions too.
- Take responsibility for your submissions. If it's bad and gets rejected, "idk, chatgpt told me to" is not a defence.
- Adhere to [Foundry VTT's AI Content Policy](https://foundryvtt.com/article/ai-policy/).
