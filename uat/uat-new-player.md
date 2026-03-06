# UAT Plan: New Player Experience

**Goal:** You are a new player who has just started the game. Your first goal is
to figure out how to play the game, understand the basic mechanics, and
retire. If you can do that, then the new player experience is successful. Do
not stop and ask questions. You're on your own. You can explore and experiment
as much as you want. However, YOUR MANDATORY GOAL, THAT YOU MUST ACHIEVE, is to
RETIRE. You should not stop until you figure out how to retire.

You CANNOT USE the .dev hack to give yourself money or to skip any parts of
the game.

First job is to figure out all of the UI elements and what they do.
For figuring out traffic between stars, you should know that the easiest way
to plan routes between stars is to record the routes you see and learn how to
navigate.

This is black box testing, so you should not have access to the code. There
will be times that you might need to explore to figure out what to do, and
that's fine. The point of this test is to see if a new player can figure out
how to play the game without any guidance.

Your MAIN OBJECTIVE is to ensure that the game isn't too easy and you can't
get tons of money with no effort, but also that the game isn't too hard and
you can't figure out.

Players might take notes. You should, too. Write them to
uat/<YYYY-MM-DD>-uat-new-player-notes.md. This will help you remember what you did and what you
learned. I'll review them later to see if there are any common issues that new
players might have. Write important items IMMEDIATELY, so you don't forget
them. You can also write down any questions you have about the game, and I'll
try to answer them as best as I can. You're a new player, so you might have
questions that I haven't thought of yet. Don't try to structure your notes too
much, just write down whatever you think is important or interesting. The more
notes you take, the better. Write things down in the order you note them.
ANYTHING that you think is off or strange or interesting, write it down.

In that <YYYY-MM-DD>-uat-new-player-notes.md file, you should write down the real start
time (from the user's perspective) as YYYY-MM-DD:HH-MM-SS and the real end
time (from the user's perspective) in the same format. You will also write
down the Date: (seen on the HUD) when you start and when you end. This will
help us understand how long it takes for a new player to figure out the game
and retire. EVERY TIME you write out more notes, preface it with actual
YYYY-MM-DD:HH-MM-SS. Also write down the Date: (seen on the HUD) at that time.
This will help us understand how long it takes for a new player to figure out
the game and retire.

Things to look for (these conditions should "raise an issue" if they are not
met):

1. MOST IMPORTANT: are there interesting or clever gameplay features that we
   forgot that would make the game more fun? 
2. Arbitrage: Are there "guaranteed wins" that players can exploit? For
   example, if there is a way to always win a battle or if there's a way to
   always make money.  Players should have to make strategic decisions, not
   just follow a formula.
3. Clarity: Are the mechanics of the game clear? Do players understand how to
   play? Players should be able to understand how to play the game without
   having to read a manual or watch a tutorial.
4. Engagement: Is the game fun to play? Do players want to keep playing? The
   game should be engaging and enjoyable to play.
5. Progression: Do players feel like they are making progress? Are there clear
   goals and rewards? Players should feel like they are progressing and
   achieving goals as they play the game.
6. Retiring: Do players understand how to retire? Is retiring a satisfying
   experience? Retiring should be a clear and rewarding goal for players to
   strive for.
7. Annoyance: Are there any mechanics that are annoying or frustrating for players? For
   example, if there is a mechanic that is too slow or if there is a mechanic
   that is too random. Players should not feel frustrated or annoyed while
   playing the game.
8. UI inconsistencies: Are there any inconsistencies in the user interface
   that might confuse players? All UI elements should be consistent and
   intuitive for players to understand.

You ONLY read the code if you need to vibe fix a bug that you found.
