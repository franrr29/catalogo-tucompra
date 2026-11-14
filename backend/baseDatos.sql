CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(100),
    activo TINYINT(1) NOT NULL DEFAULT 1,
    costo DECIMAL(10,2) NULL,
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
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_entrega ENUM('domicilio', 'agencia') NULL,
    cedula VARCHAR(10) NULL,
    departamento VARCHAR(20) NULL,
    ciudad VARCHAR(100) NULL,
    direccion VARCHAR(200) NULL,
    agencia VARCHAR(150) NULL,
    comentario VARCHAR(300) NULL,
    estado_envio ENUM('por_despachar', 'enviado', 'entregado') NULL,
    nro_seguimiento VARCHAR(60) NULL,
    enviado_en DATETIME NULL
);

CREATE TABLE pedido_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NULL,
    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,
    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);