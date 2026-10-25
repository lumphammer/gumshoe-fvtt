# Document memory

A weekend project gone awry.

An over-engineered solution to a problem that never existed.

## Background

So, I'm writing the fancy new HTML editor for journals and it strikes me that I want some kind of version-saving mechanism, so that mistakes can be safely corrected, and we can review the history of a document.

There are two questions to answer:

- What mechanism or algorithm will we use?
- Where will we store the data?

The second one (where to store it) is a question for another day.

The first one (algorithm) is where this mini-project comes in. Ideas I rapidly dropped:

- Just store the last _n_ states! REJECTED - I want to be able to store a decent age of history, like at least 100 and maybe a thousand? If the document is a megabyte (which is huge but possible) you're looking at a _gigabyte_ of backups!
- Store a long list of diffs - this is a lot better! But you're still going to be dealing with monotonically increasing storage until you hit that history limit.

I want to say now that actually a simple history of the last 1000 diffs would have be _fine_. If I was launching a startup that's what I would have done.

But I figured we could do better[^1]. What I envisioned was something where older states were stored with decreasing granularity, getting collapsed together as they age. So you can always go back to _near_ the start, but the number of individual states you can restore to gets less the older you go. But the most recent states are all individually addressable.

[^1]: worse

So I had the idea of a series of stacks. The top-level stack is where the most recent diffs get pushed. When there are _p_ diffs built up, we combine them together and push them onto the next stack down. We call _p_ the "period" of the memory - it's the base size for each stack and therefore controls the frequency with which "something happens" when you push.

## The first version

My first jab at this had the problem that the number of accessible edits would fluctuate.

To illustrate, imagine a document where I'm typing in the letters of the alphabet, a to z.

- First state: "a".
- Second state: "ab".
- Third state: "abc".
- etc.

Now imagine that we're using a period (stack size) of 3.

First state: "a" (most recent edits are at the top of the stack):

```
Stack
-----
+a
```

Second state: "ab"

```
Stack
-----
+b
+a
```

Third state: "abc"

```
Stack
-----
+c
+b
+a
```

Fourth state: "abcd"

```
Stack
-----
+d
+c
+b
+a
```

But because we hit our "stack size" limit of 3, we roll the first three into a combined edit on the next stack:

```
Stack 1    Stack 2
-------    -------
+d         +abc
```

After a bunch more edits we have something like:

```
Stack 1    Stack 2    Stack 3
-------    -------    -------
+t         +opq       +abcdefijk
+s         +lmn
+r
```

The problem is we lose fidelity on each stack every time we "push" a combined commit up to the next one.

## The bomb bay system

I went through a bunch of options here, and here's where I ended up: each stack has a list of edits, of size n, and a second list, called the "bomb bay" of commits which will be pushed onto the next stack in due course. Only the main list of edits is addressable in terms of restoring history. This uses more space, but gives much nicer behaviour. You will always have the most recent p edits, then every p^2'th edit for the next (p^2)*p commits, then every n^3th commits etc.

```
Stack 1    Stack 2
=======    =======
Edits      Edits
-----      -----
+t          +nmo
+s          +jkl
+r          +ghi

Bomb bay   Bomb bay
--------   --------
+q          +def
+p          +abc
```

What this shows is that stack 1 has two edits waiting to combined and pushed to stack 2 when the next edit comes in. Stack 2 likewise has two edits waiting to go to stack three. So on the very next keystroke, we add the letter u. Lets walk though this. First it gets added to the stack 1 edits, and +r gets moved into the bomb bay:

```
Stack 1    Stack 2    Stack 3
=======    =======    =======
Edits      Edits      Edits
-----      -----      -----
+u         +nmo
+t         +jkl
+s         +ghi

Bomb bay   Bomb bay   Bomb bay
--------   --------   --------
+r         +def
+q         +abc
+p
```

But now the stack 1 bomb bay is full, so we push "+pqr" to stack 2 (and +ghi gets moved into the bomb bay):

```
Stack 1    Stack 2
=======    =======
Edits      Edits
-----      -----
+u         +pqr
+t         +nmo
+s         +jkl

Bomb bay   Bomb bay
--------   --------
           +ghi
           +def
           +abc
```

And the same happens in stack 2, creating stack 3:

```
Stack 1    Stack 2    Stack 3
=======    =======    =======
Edits      Edits      Edits
-----      -----      -----
+u         +pqr       +abcdefghi
+t         +nmo
+s         +jkl

Bomb bay   Bomb bay   Bomb bay
--------   --------   --------
```

Stack three is new so there's nothing in the bomb bay yet. And the other two bomb bays are empty because they've been squashed and pushed over.

## Serial numbers

The memory has a property called `serial` which is a monotonically increasing number. Each new edit is tagged with the current serial. When edits get squashed and pushed, the squashed edit is tagged with the most recent serial in the squash.

This magic serial allows us to do something epically stupid, and that's what I did. See, looking at that algo above, it's pretty obvious that the moment to squash and push is "when the bomb bay is full". However... you can also work it out mathematically. If the stack period is p, each stack will push every `p^d` edits, where d is the dept of the stack (starting at 1.)

So stack 1 pushes every 3 edits; stack 2 pushes every 9 edits; stack 3 pushes every 27 edits. You can see that intuitively looking at those ascii diagrams - how many letters are in the bomb bay when we push?

There's also an offset, because these pushes don't start straight away. Think about it - stack 1 pushes every 3, but doesn't start until 6. Stack 2 pushes every 9, but doesn't start until 21.

Wait what, 21, not 18? Yeah. The formula for the "offset" is

```
(p^d) + (p^d + p^d-1 + ... + p^1)
```

So if p is 3, and d is 2:

```
3^2 + 3^2 + 3^1
= 9 + 9 + 3
= 21
```

If p is 3 and d is 3:

```
3^3 + 3^3 + 3^2 + 3^1
= 27 + 27 + 9 + 3
= 66
```

You can think of this as "each stack needs to fill its own size _twice_ and the size of all the higher stacks _once each_ before pushing downwards.

Just to be look at bigger numbers, if we had p = 100 and d = 4 (plausible production numbers for a large document with lots of edits):

```
100^4 + 100^4 + 100^3 + 100^2 + 100^1
= 100000000 + 100000000 + 1000000 + 10000 + 100
= 201010100
```

In other words, if your period is 100, your fourth stack will push onto your fifth stack every 201,010,100 edits.

And because I can do it with maths, I did.

## Diffing algorithm

Classic patch files are going to be way to big and cumbersome for this job. Luckily this is a well-explored field.

Google publishes an algorithm for syncing text state called [diff-match-patch][diff-match-patch]. There is an alternative implementation of the same idea called [fast-diff][fast-diff] which is a little faster. I suggest looking at the diff-match-patch docs for an intro but the TLDR is:

- Myers-based text diffing (same stragedy as `diff` in git)
- The output is a list up tuples of `(type, text)`, where `type` is -1 for a deletion, 0 for an equality, +1 for an insertion
- To apply a diff, you just imagine a cursor in the source text,iterate over the tuples and follow the instructions.
  - For a deletion (-1), delete the matching text.
  - For and equality (0), skip the cursor forward over the matching text.
  - For an insertion (+1), insert the text.

Both of those implementations create full diffs, which means that the content of deletions and equalities is stored in the diff. This gives you very complete data, and means that diffs can be reversed. But for append-only history like what we're doing, we really only need the _size_ of deletions and equalities.

That's where [textdiff-create][textdiff-create] and [textdiff-patch][textdiff-patch] come in. The first is a thin wrapper around fast-diff which strips out the full text for deletions and equalities and replaces it with a number, being the length of the deletion or equality. The second is a small function to apply these compacted diffs to a source text.

These compacted diffs give us enough information to store a forwards-only history (i.e. you can start from an empty string and apply changes forwards through the history to restore to any state, but you can't "roll back" an individual diff.)

[diff-match-patch]: https://github.com/google/diff-match-patch
[fast-diff]: https://github.com/jhchen/fast-diff
[textdiff-create]: https://www.npmjs.com/package/textdiff-create
[textdiff-patch]: https://github.com/icflorescu/textdiff-patch

## Snapshots and state

Given the structure above, you can restore any recorded state by applying the edits from right to left, bottom to top. By applying all the edits in this order, you get a snapshot of the current state.

And "a snapshot of the current state" is what you need every time a new state gets saved. Remember that at the top level, we need to accept the entire state, because that's what we will get from our editing component.

(Sidebar: Monaco can actually give us change events, which we could possibly convert directly into diff-match-patch, and so avoid having to run a full diff every time. But we're not doing that right now.)

To avoid having to do a full restore every time, we store a state at the top level, so when a new state comes in from the editor we can just diff the two.

Also, when we push from a stack onto a deeper stack, we want to condense all the changes into one. Note that for a while I was thinking in terms of some kind of simple append - like, you have change x, change y, and change z. It would be pretty simple to imagine some extension to the diff structure that would allow you to just concatenate x, y, and z into one long diff. But the problem there is you're not saving anything. The whole idea of the receding horizon memory is that you discard granularity as edits get older. It's okay to lose a bunch of interstitial states; what you're saving is space. But if we're just concatenating diffs, we're barely saving any space, we're just losing access to some states. To combine a series of diffs, what we really need to do is:

- Take the initial state.
- Apply each diff one by to create a final state.
- Now diff the initial state against the final state.

This will give us a diff that actually does discard all the in-between states and thus save space.

To do this we need to store a snapshot for each stack, _OR_ rebuild the history from scratch each time we push. Clearly that's suboptimal, so we store snapshots for each stack.

These are stored at the top level and passed down in the push function. The reason they are store at the top level is that it makes it much easier to strip them out for serialisation - see the next section.

## Dehydrate/rehydrate

Somewhat fancy words for what we're doing. Dehydrate takes a working document memory and returns an equivalent object with the current state and the snapshots stripped out. This form is optimised for serialisation, because the state and snapshots can be restored from the diffs.

Rehydrate does what you'd expect - it takes the denuded object from `dehydrate` and rebuilds the state and snapshots by walking the edits from right to left, top to bottom, giving you a working object memory ready to be used in a text editor.

## TL;DR

We're using [textdiff-create][textdiff-create] and [textdiff-patch][textdiff-patch] to create diffs whenever the document changes. We have a configurable "period" (p) and we condense individual diffs together every _p_ edits, so the size of the history doesn't just grow monotonically.
