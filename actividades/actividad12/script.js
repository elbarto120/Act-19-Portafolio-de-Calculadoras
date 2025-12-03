// Clase para manejar números complejos
class NumeroComplejo {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    sumar(otro) {
        return new NumeroComplejo(
            this.real + otro.real,
            this.imag + otro.imag
        );
    }

    restar(otro) {
        return new NumeroComplejo(
            this.real - otro.real,
            this.imag - otro.imag
        );
    }

    multiplicar(otro) {
        return new NumeroComplejo(
            this.real * otro.real - this.imag * otro.imag,
            this.real * otro.imag + this.imag * otro.real
        );
    }

    dividir(otro) {
        const denominador = otro.real * otro.real + otro.imag * otro.imag;
        return new NumeroComplejo(
            (this.real * otro.real + this.imag * otro.imag) / denominador,
            (this.imag * otro.real - this.real * otro.imag) / denominador
        );
    }

    toString() {
        if (this.imag === 0) {
            return this.real.toFixed(4).replace(/\.?0+$/, '');
        }
        
        const realStr = this.real.toFixed(4).replace(/\.?0+$/, '');
        const imagStr = Math.abs(this.imag).toFixed(4).replace(/\.?0+$/, '');
        
        if (this.real === 0) {
            return `${imagStr}i`;
        }
        
        const signo = this.imag >= 0 ? '+' : '-';
        return `${realStr}${signo}${imagStr}i`;
    }

    esReal() {
        return Math.abs(this.imag) < 1e-10;
    }

    esCero() {
        return Math.abs(this.real) < 1e-10 && Math.abs(this.imag) < 1e-10;
    }
}

// Función para parsear un polinomio en formato algebraico
function parsearPolinomio(str) {
    str = str.trim().replace(/\s/g, '');
    
    // Encontrar el grado máximo
    const gradoMatch = str.match(/x\^(\d+)/g);
    let gradoMax = 1;
    
    if (gradoMatch) {
        gradoMax = Math.max(...gradoMatch.map(m => parseInt(m.match(/\d+/)[0])));
    } else if (str.includes('x')) {
        gradoMax = 1;
    } else {
        gradoMax = 0;
    }
    
    // Inicializar array de coeficientes con ceros
    const coeficientes = new Array(gradoMax + 1).fill(null).map(() => new NumeroComplejo(0));
    
    // Reemplazar términos implícitos
    str = str.replace(/([+-])\s*x/g, '$1 1x');
    str = str.replace(/^x/, '1x');
    
    // Extraer términos
    const terminos = str.match(/[+-]?[^+-]+/g) || [];
    
    for (let termino of terminos) {
        termino = termino.trim();
        
        if (!termino) continue;
        
        let coef, grado;
        
        if (!termino.includes('x')) {
            // Término independiente
            coef = parsearComplejo(termino);
            grado = 0;
        } else if (termino.includes('x^')) {
            // Término con exponente explícito
            const partes = termino.split('x^');
            coef = partes[0] === '' || partes[0] === '+' ? new NumeroComplejo(1) : 
                   partes[0] === '-' ? new NumeroComplejo(-1) : 
                   parsearComplejo(partes[0]);
            grado = parseInt(partes[1]);
        } else {
            // Término con x (grado 1)
            const partes = termino.split('x');
            coef = partes[0] === '' || partes[0] === '+' ? new NumeroComplejo(1) : 
                   partes[0] === '-' ? new NumeroComplejo(-1) : 
                   parsearComplejo(partes[0]);
            grado = 1;
        }
        
        const indice = gradoMax - grado;
        coeficientes[indice] = coeficientes[indice].sumar(coef);
    }
    
    return coeficientes;
}

// Función para parsear números complejos
function parsearComplejo(str) {
    str = str.trim().replace(/\s/g, '');
    
    if (!str.includes('i')) {
        return new NumeroComplejo(parseFloat(str));
    }

    str = str.replace(/i/g, '');
    
    let real = 0;
    let imag = 0;

    const regex = /([+-]?\d*\.?\d+)([+-]\d*\.?\d+)?/;
    const match = str.match(regex);

    if (match) {
        if (str.indexOf('+') > 0 || (str.indexOf('-') > 0 && str.indexOf('-') !== 0)) {
            const partes = str.split(/(?=[+-])/);
            real = parseFloat(partes[0]) || 0;
            imag = parseFloat(partes[1]) || 1;
        } else {
            imag = parseFloat(str) || 1;
        }
    }

    return new NumeroComplejo(real, imag);
}

// **NUEVA FUNCIÓN: División larga de polinomios**
function divisionLarga(dividendo, divisor) {
    const cociente = [];
    let resto = [...dividendo];
    const pasos = [];
    
    const gradoDividendo = dividendo.length - 1;
    const gradoDivisor = divisor.length - 1;
    
    // Si el grado del dividendo es menor que el del divisor
    if (gradoDividendo < gradoDivisor) {
        return {
            cociente: [new NumeroComplejo(0)],
            residuo: dividendo,
            pasos: []
        };
    }
    
    // Algoritmo de división larga
    while (resto.length >= divisor.length && !resto[0].esCero()) {
        // Dividir el primer término del resto entre el primer término del divisor
        const coefCociente = resto[0].dividir(divisor[0]);
        cociente.push(coefCociente);
        
        // Multiplicar el divisor por el coeficiente obtenido
        const subProducto = divisor.map(d => d.multiplicar(coefCociente));
        
        pasos.push({
            resto: [...resto],
            coefCociente: coefCociente,
            subProducto: subProducto
        });
        
        // Restar el producto del resto
        for (let i = 0; i < divisor.length; i++) {
            resto[i] = resto[i].restar(subProducto[i]);
        }
        
        // Eliminar el primer término (que ahora es cero)
        resto.shift();
    }
    
    // Limpiar ceros del residuo
    while (resto.length > 0 && resto[0].esCero()) {
        resto.shift();
    }
    
    if (resto.length === 0) {
        resto = [new NumeroComplejo(0)];
    }
    
    return {
        cociente: cociente.length > 0 ? cociente : [new NumeroComplejo(0)],
        residuo: resto,
        pasos: pasos
    };
}

// **NUEVA FUNCIÓN: Formatear polinomio para mostrar**
function formatearPolinomio(coeficientes) {
    let str = '';
    const grado = coeficientes.length - 1;
    
    for (let i = 0; i < coeficientes.length; i++) {
        const exp = grado - i;
        const coef = coeficientes[i];
        
        if (coef.esCero()) continue;
        
        if (str && (coef.real > 0 || (coef.real === 0 && coef.imag > 0))) {
            str += ' + ';
        } else if (str) {
            str += ' ';
        }
        
        if (exp === 0) {
            str += coef.toString();
        } else {
            if (!(coef.real === 1 && coef.imag === 0)) {
                str += `(${coef.toString()})`;
            }
            str += 'x';
            if (exp > 1) {
                str += `<sup>${exp}</sup>`;
            }
        }
    }
    
    return str || '0';
}

// Función principal para calcular la división
function calcularDivision() {
    try {
        const polinomioStr = document.getElementById('polinomio').value;
        const raizStr = document.getElementById('raiz').value;

        if (!polinomioStr || !raizStr) {
            throw new Error('Por favor ingresa todos los datos');
        }

        const dividendo = parsearPolinomio(polinomioStr);
        const divisor = parsearPolinomio(raizStr);

        // Usar división larga (funciona para cualquier polinomio)
        const resultado = divisionLarga(dividendo, divisor);
        
        mostrarResultadoLargo(resultado, dividendo, divisor, polinomioStr, raizStr);

    } catch (error) {
        document.getElementById('resultado').innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
        document.getElementById('resultado').classList.add('show');
    }
}

// Algoritmo de división sintética (se mantiene como alternativa)
function divisionSintetica(coeficientes, raiz) {
    const n = coeficientes.length;
    const proceso = [];
    const resultado = [];

    proceso.push([...coeficientes]);
    proceso.push([new NumeroComplejo(0)]);
    
    resultado.push(coeficientes[0]);
    
    for (let i = 1; i < n; i++) {
        const producto = resultado[i - 1].multiplicar(raiz);
        proceso[1].push(producto);
        resultado.push(coeficientes[i].sumar(producto));
    }

    const cociente = resultado.slice(0, -1);
    const residuo = resultado[resultado.length - 1];

    return {
        proceso: proceso,
        resultado: resultado,
        cociente: cociente,
        residuo: residuo
    };
}

// **NUEVA FUNCIÓN: Mostrar resultado de división larga**
function mostrarResultadoLargo(resultado, dividendo, divisor, polinomioOriginal, divisorOriginal) {
    let html = '<div class="result-title">División de Polinomios</div>';
    
    html += '<div style="background: white; padding: 20px; border: 2px solid #4a5568; border-radius: 8px; margin-bottom: 20px;">';
    html += '<p style="font-size: 1.1em; margin-bottom: 10px;"><strong>Dividendo:</strong> ' + polinomioOriginal + '</p>';
    html += '<p style="font-size: 1.1em;"><strong>Divisor:</strong> ' + divisorOriginal + '</p>';
    html += '</div>';

    html += '<div class="final-result">';
    html += '<p><strong>Cociente:</strong> ' + formatearPolinomio(resultado.cociente) + '</p>';
    html += '<p><strong>Residuo:</strong> ' + formatearPolinomio(resultado.residuo) + '</p>';
    
    if (resultado.residuo.length === 1 && resultado.residuo[0].esCero()) {
        html += '<p style="color: #2d7a3e; font-weight: 600; margin-top: 15px;">✓ La división es exacta (residuo = 0)</p>';
    }

    html += '<div style="margin-top: 25px; padding: 15px; background: #f7fafc; border-left: 4px solid #4299e1; border-radius: 4px;">';
    html += '<p style="font-weight: 600; color: #2c5282;">Verificación:</p>';
    html += '<p style="color: #4a5568; margin-top: 8px;">Dividendo = (Cociente) × (Divisor) + Residuo</p>';
    html += '<p style="color: #4a5568; margin-top: 5px; font-size: 0.95em;">';
    html += polinomioOriginal + ' = (' + formatearPolinomio(resultado.cociente) + ') × (' + divisorOriginal + ') + ' + formatearPolinomio(resultado.residuo);
    html += '</p>';
    html += '</div>';
    
    html += '</div>';

    document.getElementById('resultado').innerHTML = html;
    document.getElementById('resultado').classList.add('show');
}

// Función para mostrar el resultado en HTML (división sintética - se mantiene)
function mostrarResultado(resultado, coeficientes, raiz, polinomioOriginal) {
    let html = '<div class="result-title">Polinomio Original</div>';
    html += '<div style="text-align: center; font-size: 1.2em; margin-bottom: 20px; padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 4px;">';
    html += '<strong>' + polinomioOriginal + '</strong>';
    html += '</div>';

    html += '<div class="result-title">Coeficientes Extraídos</div>';
    html += '<table class="process-table" style="margin-bottom: 30px;">';
    html += '<tr>';
    for (let i = 0; i < coeficientes.length; i++) {
        const exp = coeficientes.length - 1 - i;
        html += '<td><strong>';
        if (exp === 0) {
            html += 'Término independiente';
        } else if (exp === 1) {
            html += 'x';
        } else {
            html += 'x<sup>' + exp + '</sup>';
        }
        html += '</strong></td>';
    }
    html += '</tr>';
    html += '<tr>';
    coeficientes.forEach(c => {
        html += '<td>' + c.toString() + '</td>';
    });
    html += '</tr>';
    html += '</table>';

    html += '<div class="result-title">Proceso de División Sintética</div>';

    html += '<table class="process-table">';
    
    html += '<tr><td class="divisor-cell">Divisor: ' + raiz.toString() + '</td>';
    coeficientes.forEach(c => {
        html += '<td>' + c.toString() + '</td>';
    });
    html += '</tr>';

    html += '<tr><td class="divisor-cell">Multiplicar y bajar</td>';
    resultado.proceso[1].forEach(p => {
        html += '<td>' + p.toString() + '</td>';
    });
    html += '</tr>';

    html += '<tr><td class="divisor-cell">Resultado (sumar)</td>';
    resultado.resultado.forEach(r => {
        html += '<td>' + r.toString() + '</td>';
    });
    html += '</tr>';

    html += '</table>';

    html += '<div class="final-result">';
    html += '<p><strong>Cociente:</strong> ';
    
    let cocienteStr = '';
    for (let i = 0; i < resultado.cociente.length; i++) {
        const exp = resultado.cociente.length - 1 - i;
        const coef = resultado.cociente[i];
        
        if (coef.real !== 0 || coef.imag !== 0) {
            if (cocienteStr && (coef.real > 0 || (coef.real === 0 && coef.imag > 0))) {
                cocienteStr += ' + ';
            }
            
            cocienteStr += '(' + coef.toString() + ')';
            
            if (exp > 0) {
                cocienteStr += 'x';
                if (exp > 1) {
                    cocienteStr += '<sup>' + exp + '</sup>';
                }
            }
        }
    }
    
    html += cocienteStr || '0';
    html += '</p>';
    
    html += '<p><strong>Residuo:</strong> ' + resultado.residuo.toString() + '</p>';
    
    if (resultado.residuo.esReal() && Math.abs(resultado.residuo.real) < 1e-10) {
        html += '<p style="color: #333; font-weight: 600;">✓ La división es exacta (residuo = 0)</p>';
    }
    
    html += '</div>';

    document.getElementById('resultado').innerHTML = html;
    document.getElementById('resultado').classList.add('show');
}