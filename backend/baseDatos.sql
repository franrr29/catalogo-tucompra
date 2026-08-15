CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto_imagenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    orden INT,
    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    mercadopago_id VARCHAR(100),
    estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedido_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,
    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);