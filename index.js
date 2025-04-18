// GOAL: find coefficients of polynomial to match data points with least error

// METHOD:
// gradient = partial d(loss)/d(coefficient) for each coefficient
// repeatedly tweak coefficients based on negative gradient

// don't mind the spaghetti code

const canvas = document.querySelector("#canv");
const ctx = canvas.getContext("2d");

const num_data_points = 4;
const point_x_separation = 1.5;
const num_curves = 1;
const degree = 3;
const step = 1e-7;
const substeps = 1000;
const learning_factor = 1e-5;
const screen_divisions = 250;

const data_points = [];

while (data_points.length < num_data_points) {
    const point = [Math.random() * 10 - 5, Math.random() * 10 - 5];

    let bad = false;
    for (const other of data_points)
        if (Math.abs(other[0] - point[0]) < point_x_separation) bad = true;

    if (!bad) data_points.push(point);
}

let coefficient_s = [];

for (let i = 0; i < num_curves; i++) {
    let eq = [];
    
    for (let j = 0; j < degree + 1; j++)
        eq.push(Math.random() * 2 - 1);

    coefficient_s.push(eq);
}


// let coefficients = [0, 0, 0, 0];

const func = (x, coeffs) => {
    let result = 0;

    for (let i = 0; i < coeffs.length; i++)
        result += coeffs[i] * (x ** i);

    return result;
}

const loss = c => {
    let sum = 0;

    for (const [x, y] of data_points)
        sum += (func(x, c) - y) ** 2;

    return sum / data_points.length;
}

const partial_diff_loss = (coeffs, tweaked_coeffs, diff) => (loss(tweaked_coeffs) - loss(coeffs)) / diff;

const gradient = coeffs => {
    const result = [];

    for (let i = 0; i < coeffs.length; i++) {
        const tweakedCoefficients = [...coeffs];
        tweakedCoefficients[i] += step;

        const partial_diff = partial_diff_loss(coeffs, tweakedCoefficients, step);

        result.push(partial_diff);
    }

    return result;
}

const translate = (n, w) => {
    // [-7, 7] -> [0, w]
    
    return (n + 7) / 14 * w;
}

const inv_translate = (n, w) => {
    // [0, w] -> [-7, 7]

    return (n / w) * 14 - 7;
}

const transform = (x, y) => {
    // x, y [-7, 7] -> [0, 400] (where y is inverted)

    const translated_x = translate(x, canvas.width);
    const translated_y = canvas.width - translate(y, canvas.height);
    
    return [translated_x, translated_y];
}

const inv_transform = (x, y) => {
    // x, y [0, 400] -> [-7, 7] (where y is inverted)

    const translated_x = inv_translate(x, canvas.width);
    const translated_y = -inv_translate(y, canvas.height);
    
    return [translated_x, translated_y];
}

const get_eq = coeffs => {
    let result = "";

    for (let i = 0; i < coeffs.length; i++) {
        const coeff_num = coeffs[i].toFixed(2);
        const sign = Math.sign(coeff_num) == 1 ? "+" : "-";

        if (i == 0) {
            result = `${coeff_num}`;
            continue;
        } else if (i == 1) {
            result += ` ${sign} ${Math.abs(coeff_num)}x`;
            continue;
        }
        
        result += ` ${sign} ${Math.abs(coeff_num)}x^${i}`;
    }

    return result;
}

const simulation_step = () => {
    requestAnimationFrame(simulation_step);
    
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#333";
    ctx.fillRect(0, canvas.height / 2, canvas.width, 1);
    ctx.fillRect(canvas.width / 2, 0, 1, canvas.height);
    
    for (const coefficients of coefficient_s) {
        
        for (let i = 0; i < substeps; i++) {
            const grad = gradient(coefficients);
            
            for (let i = 0; i < coefficients.length; i++)
                coefficients[i] -= grad[i] * learning_factor;
        }
            
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";

        ctx.moveTo(0, func(-5, coefficients));
        ctx.beginPath();
        
        for (let x = -10; x <= 10; x += (20 / screen_divisions)) {
            const [x_screen, y_screen] = transform(x, func(x, coefficients));
            ctx.lineTo(x_screen, y_screen);
        }

        ctx.stroke();
        ctx.closePath();
        
        ctx.font = "16px Arial";
        ctx.fillStyle = "#555";

        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, 0, 350, 65);
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#fff";
        ctx.fillText(`Equation: ${get_eq(coefficients)}`, 10, 25);
        ctx.fillText(`Loss: ${loss(coefficients).toFixed(3)}`, 10, 50);
    }


    ctx.fillStyle = "#f00";
    ctx.lineWidth = 2;

    for (const [x, y] of data_points) {
        const [nx, ny] = transform(x, y);
        
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
}

simulation_step();

window.oncontextmenu = e => e.preventDefault();

let dragging = false;

canvas.onmousedown = e => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();

    const screen_x = e.clientX - rect.left; 
    const screen_y = e.clientY - rect.top;

    const [x, y] = inv_transform(screen_x, screen_y);

    if (e.button == 2) data_points.push([x, y]);
    else if (e.button == 0) dragging = true;
}

window.onmouseup = e => {
    if (e.button == 0)
        dragging = false;
}

canvas.onmousemove = e => {
    if (dragging) {
        e.preventDefault();
    
        const rect = canvas.getBoundingClientRect();

        const screen_x = e.clientX - rect.left; 
        const screen_y = e.clientY - rect.top;

        const [x, y] = inv_transform(screen_x, screen_y);

        let closest_dist = Infinity;
        let closest_point;

        for (const point of data_points) {
            const dist = Math.hypot(point[0] - x, point[1] - y);
            
            if (dist < closest_dist) {
                closest_dist = dist;
                closest_point = point;
            }
        }

        closest_point[0] = x;
        closest_point[1] = y;
    }
}
