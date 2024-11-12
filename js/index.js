let productos = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let descuentoAplicado = 0; 

const contenedorProductos = document.querySelector('.contenerdor-cards1');


async function cargarProductos() {
    try {
        const response = await fetch('./productos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        productos = await response.json();
        mostrarProductos();
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        Toastify({
            text: 'Error al cargar los productos. Por favor, intenta nuevamente más tarde.',
            duration: 5000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "#f87d7d",
            stopOnFocus: true,
        }).showToast();
    }
}

function mostrarProductos() {
    if (!Array.isArray(productos)) {
        console.error('Los datos de productos no son un array.');
        return;
    }

    contenedorProductos.innerHTML = '';
    productos.forEach(producto => {
        if (producto.id && producto.nombre && producto.precio && producto.imagen) {
            const productoCard = document.createElement('article');
            productoCard.classList.add('card');
            productoCard.innerHTML = `
                <div class="card-img">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                </div>
                <div class="card-info">
                    <h3>${producto.nombre}</h3>
                    <p>Valor: $${producto.precio}</p>
                    <button class="btn-agregar" data-id="${producto.id}">Agregar al Carrito</button>
                </div>
            `;
            contenedorProductos.appendChild(productoCard);
        } else {
            console.warn('Producto con formato incorrecto:', producto);
        }
    });
}

contenedorProductos.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-agregar')) {
        const idProducto = parseInt(e.target.getAttribute('data-id'));
        agregarAlCarrito(idProducto);
    }
});

function agregarAlCarrito(idProducto) {
    const producto = productos.find(p => p.id === idProducto);
    if (producto) {
        const productoEnCarrito = carrito.find(p => p.id === idProducto);
        if (productoEnCarrito) {
            productoEnCarrito.cantidad += 1;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
        mostrarCarrito();
        calcularTotal();
        Toastify({
            text: `${producto.nombre} ha sido agregado al carrito.`,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "#124361",
            stopOnFocus: true,
        }).showToast();
    }
}

function mostrarCarrito() {
    const divCarrito = document.getElementById('carrito') || crearDivCarrito();
    divCarrito.innerHTML = `
        <div class="carrito-card">
            <h3>Carrito de Compras</h3>
            <div class="carrito-items">
                ${carrito.length === 0 ? '<p>El carrito está vacío.</p>' : ''}
            </div>
            <div class="carrito-total"></div>
            <!-- Campo para código de descuento -->
            ${carrito.length > 0 ? `
            <div class="descuento-div">
                <input type="text" id="codigo-descuento" placeholder="Código de descuento">
                <button id="btn-aplicar-descuento">Aplicar Descuento</button>
            </div>` : ''}
            <button id="btn-pagar" class="btn-pagar" ${carrito.length === 0 ? 'style="display: none;"' : ''}>Pagar</button>
        </div>
    `;

    const carritoItemsDiv = divCarrito.querySelector('.carrito-items');
    const carritoTotalDiv = divCarrito.querySelector('.carrito-total');

    if (carrito.length > 0) {
        carritoItemsDiv.innerHTML = '';
        carrito.forEach(producto => {
            const productoDiv = document.createElement('div');
            productoDiv.classList.add('producto-carrito');
            const precioTotalProducto = producto.precio * producto.cantidad;
            productoDiv.innerHTML = `
                <p>
                    <strong>${producto.nombre}</strong><br>
                    Precio unitario: $${producto.precio.toFixed(2)}<br>
                    Cantidad: ${producto.cantidad}<br>
                    Total: $${precioTotalProducto.toFixed(2)}
                </p>
                <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
            `;
            carritoItemsDiv.appendChild(productoDiv);
        });
        calcularTotal();


        const btnAplicarDescuento = divCarrito.querySelector('#btn-aplicar-descuento');
        btnAplicarDescuento.addEventListener('click', () => {
            const codigo = divCarrito.querySelector('#codigo-descuento').value.trim();
            aplicarDescuento(codigo);
        });
    }


    const btnPagar = divCarrito.querySelector('#btn-pagar');
    btnPagar?.addEventListener('click', () => {
        if (carrito.length === 0) {
            Toastify({
                text: 'El carrito está vacío. Agrega productos antes de pagar.',
                duration: 3000,
                gravity: "bottom",
                position: "right",
                backgroundColor: "#f87d7d",
                stopOnFocus: true,
            }).showToast();
            return;
        }

        Toastify({
            text: 'Pago realizado con éxito. ¡Gracias por su compra!',
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "green",
            stopOnFocus: true,
        }).showToast();

        carrito = [];
        localStorage.removeItem('carrito');
        descuentoAplicado = 0; 
        mostrarCarrito();
        calcularTotal();
    });

    inicializarEventosCarrito();
}

function crearDivCarrito() {
    const divCarrito = document.createElement('div');
    divCarrito.id = 'carrito';
    document.querySelector('main').appendChild(divCarrito);

    return divCarrito;
}

function inicializarEventosCarrito() {
    const divCarrito = document.getElementById('carrito');
    divCarrito.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-eliminar')) {
            const idProducto = parseInt(e.target.getAttribute('data-id'));
            eliminarDelCarrito(idProducto);
        }
    });
}

function eliminarDelCarrito(idProducto) {
    const producto = carrito.find(p => p.id === idProducto);
    if (producto) {
        if (producto.cantidad > 1) {
            producto.cantidad -= 1;
        } else {
            carrito = carrito.filter(p => p.id !== idProducto);
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
        mostrarCarrito();
        calcularTotal();
        Toastify({
            text: `Producto eliminado del carrito.`,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "#f87d7d",
            stopOnFocus: true,
        }).showToast();
    }
}

function calcularTotal() {
    const subtotal = carrito.reduce((acc, producto) => acc + (producto.precio * producto.cantidad), 0);
    const tasaImpuesto = 0.15;
    const impuesto = subtotal * tasaImpuesto;
    const descuento = subtotal * descuentoAplicado;
    const total = subtotal + impuesto - descuento;

    const carritoTotalDiv = document.querySelector('.carrito-total');
    if (carritoTotalDiv) {
        carritoTotalDiv.innerHTML = `
            <p>Subtotal: $${subtotal.toFixed(2)}</p>
            <p>Impuesto (15%): $${impuesto.toFixed(2)}</p>
            <p>Descuento: $${descuento.toFixed(2)}</p>
            <p><strong>Total a Pagar: $${total.toFixed(2)}</strong></p>
        `;
    }
}

function aplicarDescuento(codigo) {
    const descuentos = {
        'DESCUENTO10': 0.10,
        'DESCUENTO20': 0.20
    };

    if (descuentos[codigo]) {
        descuentoAplicado = descuentos[codigo];
        Toastify({
            text: `Código de descuento aplicado: ${codigo}`,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "green",
            stopOnFocus: true,
        }).showToast();
    } else {
        descuentoAplicado = 0;
        Toastify({
            text: `Código de descuento inválido.`,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "#f87d7d",
            stopOnFocus: true,
        }).showToast();
    }
    calcularTotal();
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    mostrarCarrito();
    calcularTotal();
});
