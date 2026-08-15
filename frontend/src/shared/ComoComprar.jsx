import { motion } from "framer-motion";

function ComoComprar() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased px-6 sm:px-12 lg:px-16 pt-32 pb-24 selection:bg-[#E2E2DF]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-border pb-8">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-ink">
              CÓMO <span className="font-semibold text-brand">COMPRAR</span>
            </h1>
          </motion.div>
        </header>

        <div className="flex flex-col gap-16 max-w-3xl">

          <section className="flex flex-col gap-6">
            <h2 className="text-xs font-sans text-muted-light uppercase tracking-wider mb-2">
              Pasos para comprar
            </h2>
            {[
              { 
                num: "01", 
                titulo: "Elegí tu producto", 
                desc: "Navegá el catálogo y agregá lo que quieras al carrito.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.25 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                  </svg>
                )
              },
              { 
                num: "02", 
                titulo: "Revisá tu carrito", 
                desc: "Verificá los productos y cantidades antes de continuar.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.66 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.66m-5.801 0c-.375.023-.75.07-1.122.143C4.715 4.892 3.75 5.85 3.75 7.018v11.232c0 1.243 1.01 2.25 2.25 2.25h9.75a2.25 2.25 0 0 0 2.25-2.25V7.018c0-1.168-.965-2.125-2.128-2.238A49.512 49.512 0 0 0 15 4.5m-5.75 7.5h-1.5m1.5 3h-1.5m3-6h-1.5" />
                  </svg>
                )
              },
              { 
                num: "03", 
                titulo: "Finalizá por WhatsApp", 
                desc: "Envianos tu carrito por WhatsApp indicando método para pagar.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-5 h-5 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                )
              },
            ].map((paso) => (
              <div key={paso.num} className="flex gap-6 items-start border border-border rounded-2xl p-8 bg-transparent transition-all duration-300 hover:border-[#111111]">
                <div className="mt-0.5">{paso.icon}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-sans text-xs text-brand font-semibold">{paso.num}</span>
                    <h3 className="text-sm font-medium uppercase tracking-wide text-ink">{paso.titulo}</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{paso.desc}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-sans text-muted-light uppercase tracking-wider mb-2">
              Métodos de pago
            </h2>
            {[
              { 
                metodo: "Giros", 
                detalle: "Mediante ABITAB o REDPAGOS.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.75 2.25M2.25 18.75V5.25A2.25 2.25 0 0 1 4.5 3h15a2.25 2.25 0 0 1 2.25 2.25v13.5M6 10.5h2.25M6 13.5h2.25M10.5 10.5h7.5M10.5 13.5h7.5" />
                  </svg>
                )
              },
              { 
                metodo: "Transferencia bancaria", 
                detalle: "Te enviamos los datos por WhatsApp.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 10.5V11.25m-15 0V19.5m4.5-15h6" />
                  </svg>
                )
              },
              { 
                metodo: "Mercado Pago", 
                detalle: "Nos pedis el link del producto y te enviamos.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                )
              },
              { 
                metodo: "Transferencias por tarjetas PREX o Mi Dinero", 
                detalle: "Te enviamos numeros de cuenta.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )
              }
            ].map((item) => (
              <div key={item.metodo} className="flex justify-between items-center gap-4 border border-border rounded-2xl px-8 py-5 bg-transparent transition-all duration-300 hover:border-[#111111]">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-xs uppercase tracking-wide text-ink font-medium">{item.metodo}</span>
                </div>
                <span className="text-xs text-muted text-right max-w-[50%] font-sans">{item.detalle}</span>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-sans text-muted-light uppercase tracking-wider mb-2">
              Envíos
            </h2>
            {[
              { 
                zona: "Rivera", 
                detalle: "Coordinamos entrega en Terminal.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )
              },
              { 
                zona: "A todo el pais", 
                detalle: "Vía DAC, Turil, COPAY, Nuñez, Correo Uruguayo, etc.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-4 h-4 text-brand">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-9m18-11.25h-3.375a1.125 1.125 0 0 1-1.09-.86l-1.02-4.59A1.125 1.125 0 0 0 12.825 1.5H9.75m-6 13.5V6.75A2.25 2.25 0 0 1 6 4.5h9.75" />
                  </svg>
                )
              },
            ].map((item) => (
              <div key={item.zona} className="flex justify-between items-center border border-border rounded-2xl px-8 py-5 bg-transparent transition-all duration-300 hover:border-[#111111]">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-xs uppercase tracking-wide text-ink font-medium">{item.zona}</span>
                </div>
                <span className="text-xs text-muted font-sans">{item.detalle}</span>
              </div>
            ))}
          </section>

        </div>
      </div>
    </div>
  );
}

export default ComoComprar;