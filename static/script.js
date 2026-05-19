let chartInstance = null;

function generateMatrix() {
    const n = parseInt(document.getElementById('eq_count').value);
    const container = document.getElementById('matrix_section');
    container.innerHTML = '';
    
    if (isNaN(n) || n < 2 || n > 10) {
        alert("Please select a parameter size between 2 and 10.");
        return;
    }

    const header = document.createElement('h3');
    header.style.alignSelf = 'flex-start';
    header.innerHTML = `<i class="fa-solid fa-table-cells" style="color:var(--accent-blue); margin-right: 8px;"></i> Populate Coefficients & Vector Matrix`;
    container.appendChild(header);

    for (let i = 0; i < n; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'matrix-row';
        
        // Generate matrix A boxes
        for (let j = 0; j < n; j++) {
            rowDiv.innerHTML += `<input type="number" class="matrix-cell coeff-a" data-row="${i}" data-col="${j}" step="any" placeholder="a${i+1}${j+1}">`;
        }
        
        rowDiv.innerHTML += `<span class="equals-sign">=</span>`;
        
        // Generate vector B boxes
        rowDiv.innerHTML += `<input type="number" class="matrix-cell constant-cell coeff-b" data-row="${i}" step="any" placeholder="b${i+1}">`;
        
        container.appendChild(rowDiv);
    }

    document.getElementById('config_panel').style.display = 'block';
    document.getElementById('output_section').style.display = 'none';
}

async function solveSystem() {
    const n = parseInt(document.getElementById('eq_count').value);
    const A = Array.from({ length: n }, () => Array(n).fill(0));
    const B = Array(n).fill(0);

    const aInputs = document.querySelectorAll('.coeff-a');
    const bInputs = document.querySelectorAll('.coeff-b');

    try {
        aInputs.forEach(input => {
            const r = parseInt(input.getAttribute('data-row'));
            const c = parseInt(input.getAttribute('data-col'));
            if(input.value === "") throw new Error();
            A[r][c] = parseFloat(input.value);
        });
        bInputs.forEach(input => {
            const r = parseInt(input.getAttribute('data-row'));
            if(input.value === "") throw new Error();
            B[r] = parseFloat(input.value);
        });
    } catch (e) {
        return alert("All matrix blocks must be populated with numbers.");
    }

    const methods = [];
    if (document.getElementById('method_gaussian').checked) methods.push('gaussian');
    if (document.getElementById('method_jordan').checked) methods.push('jordan');
    if (document.getElementById('method_lu').checked) methods.push('lu');

    if (methods.length === 0) return alert("Select at least one computational model.");

    const response = await fetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ A, B, methods })
    });

    const data = await response.json();
    if (!data.success) return alert("Error processing calculation: " + data.error);

    document.getElementById('output_section').style.display = 'grid';
    let resHtml = '';
    const methodNames = [];
    const executionTimes = [];

    for (const [method, res] of Object.entries(data.results)) {
        methodNames.push(method);
        executionTimes.push(res.time);
        
        let colorClass = method.toLowerCase() === 'gaussian' ? 'card-gaussian' : (method.toLowerCase() === 'gauss-jordan' ? 'card-jordan' : 'card-lu');
        
        resHtml += `<div class="method-output-card ${colorClass}">`;
        resHtml += `<div class="method-name-tag">${method} Method</div>`;
        resHtml += `<div>`;
        res.solution.forEach((val, index) => {
            resHtml += `<span class="variable-badge"><b>x<sub>${index + 1}</sub></b> = ${val.toFixed(6)}</span>`;
        });
        resHtml += `</div>`;
        resHtml += `<div class="time-lbl"><i class="fa-regular fa-clock"></i> Delta-T: ${res.time.toFixed(8)} seconds</div>`;
        resHtml += `</div>`;
    }
    document.getElementById('results_text').innerHTML = resHtml;

    // Build modern dark-theme Chart
    const ctx = document.getElementById('timeChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: methodNames,
            datasets: [{
                data: executionTimes,
                backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)'],
                borderColor: ['#3b82f6', '#f59e0b', '#10b981'],
                borderWidth: 1.5,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { weight: '600' } }
                }
            }
        }
    });
}
