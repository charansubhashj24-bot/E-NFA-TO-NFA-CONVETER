document.addEventListener('DOMContentLoaded', () => {
    const transitionsContainer = document.getElementById('transitions-container');
    const addTransitionBtn = document.getElementById('add-transition-btn');
    const convertBtn = document.getElementById('convert-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const resultsSection = document.getElementById('results-section');

    for (let i = 0; i < 3; i++) {
        addTransitionRow();
    }

    addTransitionBtn.addEventListener('click', () => addTransitionRow());

    convertBtn.addEventListener('click', () => {
        const enfa = parseInput();
        if (!enfa) return;

        const nfa = convertENFAtoNFA(enfa);
        displayResults(enfa, nfa);
    });

    sampleBtn.addEventListener('click', loadSample);

    function addTransitionRow(from = '', symbol = '', to = '') {
        const row = document.createElement('div');
        row.className = 'transition-row';
        row.innerHTML = `
            <input type="text" class="from-state" placeholder="q0" value="${from}">
            <input type="text" class="symbol" placeholder="a or ε" value="${symbol}">
            <input type="text" class="to-states" placeholder="q1, q2" value="${to}">
            <button class="remove-btn">×</button>
        `;

        row.querySelector('.remove-btn').addEventListener('click', () => {
            row.remove();
        });

        transitionsContainer.appendChild(row);
    }

    function parseInput() {
        const statesStr = document.getElementById('states').value;
        const alphabetStr = document.getElementById('alphabet').value;
        const startState = document.getElementById('start-state').value.trim();
        const finalStatesStr = document.getElementById('final-states').value;

        const states = statesStr.split(',').map(s => s.trim()).filter(s => s);
        const alphabet = alphabetStr.split(',').map(s => s.trim()).filter(s => s);
        const finalStates = finalStatesStr.split(',').map(s => s.trim()).filter(s => s);

        if (states.length === 0 || alphabet.length === 0 || !startState) {
            alert('Please fill in States, Alphabet, and Start State.');
            return null;
        }

        const transitions = [];
        const rows = document.querySelectorAll('.transition-row:not(.header-row)');
        rows.forEach(row => {
            const from = row.querySelector('.from-state').value.trim();
            const symbol = row.querySelector('.symbol').value.trim();
            const to = row.querySelector('.to-states').value.split(',').map(s => s.trim()).filter(s => s);
            
            if (from && symbol && to.length > 0) {
                transitions.push({ from, symbol, to });
            }
        });

        return { states, alphabet, startState, finalStates, transitions };
    }

    function getEClosure(state, transitions, memo = {}) {
        if (memo[state]) return memo[state];

        let closure = new Set([state]);
        let stack = [state];

        while (stack.length > 0) {
            let curr = stack.pop();
            // Find epsilon transitions from curr
            const epsilonTrans = transitions.filter(t => 
                t.from === curr && (t.symbol === 'ε' || t.symbol.toLowerCase() === 'e' || t.symbol === '')
            );

            epsilonTrans.forEach(t => {
                t.to.forEach(nextState => {
                    if (!closure.has(nextState)) {
                        closure.add(nextState);
                        stack.push(nextState);
                    }
                });
            });
        }

        memo[state] = Array.from(closure).sort();
        return memo[state];
    }

    function convertENFAtoNFA(enfa) {
        const { states, alphabet, transitions, finalStates } = enfa;
        const eClosures = {};
        states.forEach(state => {
            eClosures[state] = getEClosure(state, transitions);
        });

        const nfaTransitions = [];
        states.forEach(q => {
            alphabet.forEach(symbol => {
                // Ignore epsilon in the new alphabet
                if (symbol === 'ε' || symbol.toLowerCase() === 'e') return;

               
                const sSet = eClosures[q];
              
                const tSet = new Set();
                sSet.forEach(s => {
                    const matches = transitions.filter(t => t.from === s && t.symbol === symbol);
                    matches.forEach(m => m.to.forEach(target => tSet.add(target)));
                });

                const uSet = new Set();
                tSet.forEach(t => {
                    const closureT = eClosures[t] || getEClosure(t, transitions);
                    closureT.forEach(u => uSet.add(u));
                });

                if (uSet.size > 0) {
                    nfaTransitions.push({
                        from: q,
                        symbol: symbol,
                        to: Array.from(uSet).sort()
                    });
                }
            });
        });

        const nfaFinalStates = states.filter(q => {
            const closure = eClosures[q];
            return closure.some(s => finalStates.includes(s));
        });

        return { states, alphabet, nfaTransitions, nfaFinalStates, eClosures };
    }

    function displayResults(enfa, nfa) {
        resultsSection.classList.remove('hidden');

        
        const closureContainer = document.getElementById('e-closure-results');
        closureContainer.innerHTML = '';
        const closureTable = document.createElement('table');
        closureTable.innerHTML = `
            <thead>
                <tr>
                    <th>State</th>
                    <th>ε-Closure</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(nfa.eClosures).map(([state, closure]) => `
                    <tr>
                        <td>${state}</td>
                        <td>{ ${closure.join(', ')} }</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        closureContainer.appendChild(closureTable);

        // Display NFA Transition Table
        const nfaTableContainer = document.getElementById('nfa-table-container');
        nfaTableContainer.innerHTML = '';
        
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>State</th>' + enfa.alphabet.filter(s => s !== 'ε' && s.toLowerCase() !== 'e').map(s => `<th>${s}</th>`).join('');
        
        const thead = document.createElement('thead');
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        enfa.states.forEach(state => {
            const row = document.createElement('tr');
            let rowHtml = `<td>${state}</td>`;
            
            enfa.alphabet.filter(s => s !== 'ε' && s.toLowerCase() !== 'e').forEach(symbol => {
                const trans = nfa.nfaTransitions.find(t => t.from === state && t.symbol === symbol);
                const targets = trans ? trans.to.join(', ') : '∅';
                rowHtml += `<td>{ ${targets} }</td>`;
            });
            
            row.innerHTML = rowHtml;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        nfaTableContainer.appendChild(table);

        // Final States
        document.getElementById('nfa-final-states-display').innerText = `{ ${nfa.nfaFinalStates.join(', ')} }`;
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function loadSample() {
        document.getElementById('states').value = 'q0, q1, q2';
        document.getElementById('alphabet').value = 'a, b';
        document.getElementById('start-state').value = 'q0';
        document.getElementById('final-states').value = 'q2';

        // Clear existing rows
        const rows = document.querySelectorAll('.transition-row:not(.header-row)');
        rows.forEach(r => r.remove());

        // Add sample rows: (q0,ε,q1), (q1,a,q1), (q1,ε,q2), (q2,b,q2)
        addTransitionRow('q0', 'ε', 'q1');
        addTransitionRow('q1', 'a', 'q1');
        addTransitionRow('q1', 'ε', 'q2');
        addTransitionRow('q2', 'b', 'q2');
        
        // Trigger conversion
        convertBtn.click();
    }
});
