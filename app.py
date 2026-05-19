from flask import Flask, render_template, request, jsonify
import numpy as np
import time

app = Flask(__name__)

def gaussian_elimination(A, B):
    n = len(B)
    A, B = A.astype(float), B.astype(float)
    for i in range(n):
        max_row = np.argmax(abs(A[i:, i])) + i
        A[[i, max_row]] = A[[max_row, i]]
        B[[i, max_row]] = B[[max_row, i]]
        for j in range(i + 1, n):
            ratio = A[j][i] / A[i][i]
            A[j, i:] -= ratio * A[i, i:]
            B[j] -= ratio * B[i]
    X = np.zeros(n)
    for i in range(n - 1, -1, -1):
        X[i] = (B[i] - np.dot(A[i, i+1:], X[i+1:])) / A[i][i]
    return X.tolist()

def gauss_jordan(A, B):
    n = len(B)
    augmented = np.hstack((A.astype(float), B.astype(float).reshape(-1, 1)))
    for i in range(n):
        max_row = np.argmax(abs(augmented[i:, i])) + i
        augmented[[i, max_row]] = augmented[[max_row, i]]
        augmented[i] /= augmented[i][i]
        for j in range(n):
            if i != j:
                augmented[j] -= augmented[j][i] * augmented[i]
    return augmented[:, -1].tolist()

def lu_decomposition(A, B):
    n = len(B)
    L, U = np.zeros((n, n)), np.zeros((n, n))
    for i in range(n):
        for k in range(i, n):
            U[i, k] = A[i, k] - sum(L[i, j] * U[j, k] for j in range(i))
        L[i, i] = 1.0
        for k in range(i + 1, n):
            L[k, i] = (A[k, i] - sum(L[k, j] * U[j, i] for j in range(i))) / U[i, i]
    Y = np.zeros(n)
    for i in range(n):
        Y[i] = B[i] - sum(L[i, j] * Y[j] for j in range(i))
    X = np.zeros(n)
    for i in range(n - 1, -1, -1):
        X[i] = (Y[i] - sum(U[i, j] * X[j] for j in range(i + 1, n))) / U[i, i]
    return X.tolist()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.json
    A = np.array(data['A'])
    B = np.array(data['B'])
    selected_methods = data['methods']
    
    results = {}
    
    try:
        if 'gaussian' in selected_methods:
            start = time.perf_counter()
            sol = gaussian_elimination(A.copy(), B.copy())
            results['Gaussian'] = {'solution': sol, 'time': time.perf_counter() - start}
            
        if 'jordan' in selected_methods:
            start = time.perf_counter()
            sol = gauss_jordan(A.copy(), B.copy())
            results['Gauss-Jordan'] = {'solution': sol, 'time': time.perf_counter() - start}
            
        if 'lu' in selected_methods:
            start = time.perf_counter()
            sol = lu_decomposition(A.copy(), B.copy())
            results['LU'] = {'solution': sol, 'time': time.perf_counter() - start}
            
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)