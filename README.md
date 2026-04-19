E-NFA to NFA Converter

This project implements a converter that transforms an Epsilon-NFA (E-NFA) into an equivalent Non-deterministic Finite Automaton (NFA) by eliminating ε-transitions while preserving the language accepted by the automaton.

Overview

In Automata Theory, an E-NFA allows transitions without consuming input symbols (ε-transitions). These transitions can make automata complex to process and analyze. This project simplifies such automata by converting them into a standard NFA with no ε-moves.

Features
Computes ε-closure for each state
Removes all ε-transitions
Generates equivalent NFA transition table
Identifies updated final states
Maintains correctness of the accepted language
How It Works
Calculate the ε-closure of every state
Use ε-closure to update transitions for each input symbol
Modify final states based on ε-reachability
Remove all ε-transitions to form the final NFA
Input
Set of states
Input alphabet
Transition function (including ε-transitions)
Start state
Final states
Output
Equivalent NFA without ε-transitions
Updated transition table
Modified set of final states
Applications
Compiler design
Regular expression processing
Automata simplification and optimization
