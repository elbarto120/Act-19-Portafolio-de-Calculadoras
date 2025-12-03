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

    multiplicar(otro) {
        return new NumeroComplejo(
            this.real * otro.real - this.imag * otro.imag,
            this.real * otro.imag + this.imag * otro.real
        );
    }

    toString() {
        // Protección contra NaN (Not a Number) para evitar el error "NoNi"
        if (isNaN(this.real) || isNaN(this.imag)) {
            return "Error";
        }

        if (this.imag === 0) {
            return parseFloat(this.real.toFixed(4)); // Limpia ceros innecesarios
        }
        
        const realStr = parseFloat(this.real.toFixed(4));
        const imagStr = parseFloat(Math.abs(this.imag).toFixed(4));
        
        if (this.real === 0) {
            return `${this.imag >= 0 ? '' : '-'}${imagStr}i`;
        }
        
        const signo = this.imag >= 0 ? '+' : '-';
        return `${realStr}${signo}${imagStr}i`;
    }

    esReal() {
        return Math.abs(this.imag) < 1e-10;
    }
}

// Función para parsear un polinomio en formato algebraico
function parsearPolinomio(str) {
    // Limpieza básica
    str = str.trim().replace(/\s/g, '');
    
    // Normalizar términos implícitos para facilitar el regex
    // Ejemplo: convirte -x en -1x, +x en +1x, y x al inicio en 1x
    str = str.replace(/([+-])x/g, '$11x'); // Reemplaza +x o -x por +1x o -1x
    if (str.startsWith('x')) str = '1' + str;
    if (str.startsWith('-x')) str = str.replace('-x', '-1x');

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
    
    // Extraer términos usando regex
    // Busca: (signo opcional)(números o complejos)(x^potencia opcional)
    const terminos = str.match(/[+-]?[^+-]+/g) || [];
    
    for (let termino of terminos) {
        if (!termino) continue;
        
        let coef, grado;
        
        if (!termino.includes('x')) {
            // Término independiente (ej: +5)
            coef = parsearComplejo(termino);
            grado = 0;
        } else if (termino.includes('x^')) {
            // Término con exponente (ej: 5x^3)
            const partes = termino.split('x^');
            // Si partes[0] está vacío o es solo signo, es 1 o -1
            let coefStr = partes[0];
            if (coefStr === '' || coefStr === '+') coefStr = '1';
            if (coefStr === '-') coefStr = '-1';
            
            coef = parsearComplejo(coefStr);
            grado = parseInt(partes[1]);
        } else {
            // Término lineal (ej: 2x)
            const partes = termino.split('x');
            let coefStr = partes[0];
            if (coefStr === '' || coefStr === '+') coefStr = '1';
            if (coefStr === '-') coefStr = '-1';
            
            coef = parsearComplejo(coefStr);
            grado = 1;
        }
        
        // Sumar al coeficiente correspondiente (maneja casos como 2x + 3x)
        const indice = gradoMax - grado;
        if (coeficientes[indice]) {
            coeficientes[indice] = coeficientes[indice].sumar(coef);
        }
    }
    
    return coeficientes;
}

// Función para parsear números complejos Y AHORA TAMBIÉN DIVISORES (x+1)
function parsearComplejo(str) {
    if (!str) return new NumeroComplejo(0);
    str = str.trim().replace(/\s/g, '');
    
    // --- CORRECCIÓN PRINCIPAL AQUÍ ---
    // Si el usuario ingresa un binomio como "x+1" o "x-2", calculamos la raíz automáticamente.
    if (str.includes('x')) {
        // Asumimos formato (x + a) o (x - a)
        // Eliminamos la 'x' inicial
        let constante = str.replace(/^x/, '').replace(/^\+x/, '');
        
        // Si quedó vacío (ej: input fue "x"), la raíz es 0
        if (constante === '') return new NumeroComplejo(0);
        
        // Parseamos el número restante
        let valor = parsearComplejo(constante);
        
        // La raíz es el inverso aditivo (Si divisor es x+1, raíz es -1)
        return new NumeroComplejo(-valor.real, -valor.imag);
    }
    // ---------------------------------

    // Si no tiene 'i', es un número real simple
    if (!str.includes('i')) {
        const val = parseFloat(str);
        if (isNaN(val)) throw new Error(`El valor "${str}" no es un número válido.`);
        return new NumeroComplejo(val);
    }

    // Lógica para números complejos (a+bi)
    str = str.replace(/i/g, '');
    
    let real = 0;
    let imag = 0;

    // Regex para separar parte real e imaginaria
    // Soporta: 3+2i, -3-2i, 2i, etc.
    if (str === '' || str === '+' || str === '-') {
        // Caso solo 'i', '+i', '-i'
        imag = (str === '-' ? -1 : 1);
    } else {
        // Buscar el último signo + o - que no esté al inicio (para separar real de imag)
        // Esto es una simplificación, para casos más robustos se requiere un parser más complejo,
        // pero funciona para los ejemplos escolares típicos.
        const match = str.match(/([+-]?[\d\.]+)([+-][\d\.]+)?/);
        
        if (match) {
            if (match[2]) {
                real = parseFloat(match[1]);
                imag = parseFloat(match[2]);
            } else {
                // Solo hay una parte, determinar si era real o imaginaria es difícil aquí
                // porque ya quitamos la 'i'. Pero como entramos al 'if includes i',
                // asumimos que lo que queda es la parte imaginaria si no hay separador.
                // PERO, parsearComplejo se llama recursivamente a veces.
                // Para simplificar: Si llegamos aquí, es formato complejo.
                
                // Si el input original era "2i", str es "2".
                // Si input era "3+2i", str es "3+2".
                
                // Vamos a usar una lógica más segura basada en posición del signo
                const lastPlus = str.lastIndexOf('+');
                const lastMinus = str.lastIndexOf('-');
                const splitIndex = Math.max(lastPlus, lastMinus);

                if (splitIndex > 0) {
                    real = parseFloat(str.substring(0, splitIndex));
                    imag = parseFloat(str.substring(splitIndex));
                } else {
                    imag = parseFloat(str);
                }
            }
        }
    }

    if (isNaN(real)) real = 0;
    if (isNaN(imag)) imag = 1; // Si falló el parseo de imag, asume 1 (caso i)

    return new NumeroComplejo(real, imag);
}

// Función principal para calcular la división
function calcularDivision() {
    try {
        const polinomioStr = document.getElementById('polinomio').value;
        const raizStr = document.getElementById('raiz').value;

        if (!polinomioStr || !raizStr) {
            throw new Error('Por favor ingresa todos los datos');
        }

        const coeficientes = parsearPolinomio(polinomioStr);
        const raiz = parsearComplejo(raizStr);

        // Verificación de seguridad
        if (isNaN(raiz.real) || isNaN(raiz.imag)) {
            throw new Error("La raíz ingresada no es válida.");
        }

        const resultado = divisionSintetica(coeficientes, raiz);
        mostrarResultado(resultado, coeficientes, raiz, polinomioStr);

    } catch (error) {
        document.getElementById('resultado').innerHTML = `
            <div class="error" style="color: red; padding: 20px; text-align: center;">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
        document.getElementById('resultado').classList.add('show');
    }
}

// Algoritmo de división sintética
function divisionSintetica(coeficientes, raiz) {
    const n = coeficientes.length;
    const proceso = [];
    const resultado = [];

    // Fila 1: Coeficientes
    proceso.push([...coeficientes]);
    
    // Fila 2: Productos (inicialmente vacío o con 0)
    // Nota: La estructura visual requiere que coincidan los índices.
    // El primer término baja directo, así que su "producto" previo es 0 virtualmente.
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

// Función para mostrar el resultado en HTML (SIN CAMBIOS VISUALES)
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
    
    html += '<tr><td class="divisor-cell">Divisor (Raíz): ' + raiz.toString() + '</td>';
    coeficientes.forEach(c => {
        html += '<td>' + c.toString() + '</td>';
    });
    html += '</tr>';

    html += '<tr><td class="divisor-cell">Multiplicar y bajar</td>';
    
    // Ajuste visual: La primera celda de multiplicación suele estar vacía o ser 0
    // Alineamos con los coeficientes
    html += '<td>↓</td>'; // Flecha para el primer término que baja directo
    
    // Mostrar el resto de multiplicaciones
    for(let i = 1; i < resultado.proceso[1].length; i++) {
         html += '<td>' + resultado.proceso[1][i].toString() + '</td>';
    }
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
    // Construcción del string del cociente
    if (resultado.cociente.every(c => c.real === 0 && c.imag === 0)) {
        cocienteStr = "0";
    } else {
        for (let i = 0; i < resultado.cociente.length; i++) {
            const exp = resultado.cociente.length - 1 - i;
            const coef = resultado.cociente[i];
            
            // Solo mostrar términos no nulos (o si es el único término)
            if (Math.abs(coef.real) > 1e-10 || Math.abs(coef.imag) > 1e-10) {
                
                // Signo de suma para términos que no son el primero
                if (cocienteStr !== '') {
                    cocienteStr += ' + ';
                }
                
                // Formateo del coeficiente
                let coefStr = coef.toString();
                // Si es 1x o -1x, ocultar el 1 para limpieza, excepto si es complejo
                if (exp > 0 && coef.esReal()) {
                    if (Math.abs(coef.real - 1) < 1e-10) coefStr = '';
                    if (Math.abs(coef.real + 1) < 1e-10) coefStr = '-';
                }

                cocienteStr += (coefStr === '' ? '1' : coefStr === '-' ? '-1' : '(' + coefStr + ')');
                
                if (exp > 0) {
                    cocienteStr += 'x';
                    if (exp > 1) {
                        cocienteStr += '<sup>' + exp + '</sup>';
                    }
                }
            }
        }
    }
    
    html += cocienteStr || '0';
    html += '</p>';
    
    html += '<p><strong>Residuo:</strong> ' + resultado.residuo.toString() + '</p>';
    
    if (resultado.residuo.esReal() && Math.abs(resultado.residuo.real) < 1e-10) {
        html += '<p style="color: #2e7d32; font-weight: 600; margin-top:10px;">✓ La división es exacta (residuo = 0)</p>';
    }
    
    html += '</div>';

    document.getElementById('resultado').innerHTML = html;
    document.getElementById('resultado').classList.add('show');
}