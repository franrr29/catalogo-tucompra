import { DEPARTAMENTOS } from "./departamentos";
import { MAX_COMENTARIO, idCampo } from "./validacionEnvio";

const claseEtiqueta = "text-[11px] font-semibold uppercase tracking-wide text-muted-light";
const claseInput = "w-full bg-white/50 rounded-lg border focus:border-brand outline-none px-4 py-3 text-sm";

// una etiqueta, su control y el mensaje de error o de ayuda
function Campo({ campo, etiqueta, opcional, ayuda, error, children }) {
  const id = idCampo(campo);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={claseEtiqueta}>
        {etiqueta}
        {opcional && <span className="font-normal normal-case tracking-normal text-[#888888]"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-[#888888]">{ayuda}</p>
      )}
    </div>
  );
}

// datos de contacto y de envio del checkout
// form: valores; errores: { campo: mensaje } ya filtrado con lo que hay que mostrar; onCambio(campo, valor); onBlur(campo)
function FormularioEnvio({ form, errores, onCambio, onBlur }) {
  const esDomicilio = form.tipoEntrega === "domicilio";

  // props comunes de cada control: id, valor, accesibilidad del error y manejo de cambios
  const props = (campo) => ({
    id: idCampo(campo),
    value: form[campo],
    onChange: (e) => onCambio(campo, e.target.value),
    onBlur: () => onBlur(campo),
    "aria-invalid": errores[campo] ? true : undefined,
    "aria-describedby": errores[campo] ? `${idCampo(campo)}-error` : undefined,
    className: `${claseInput} ${errores[campo] ? "border-red-400" : "border-[#1A1A1A]/15"}`,
  });

  return (
    <>
      <Campo campo="nombre" etiqueta="Nombre de quien recibe" error={errores.nombre}>
        <input type="text" autoComplete="name" placeholder="Juan Pérez" {...props("nombre")} />
      </Campo>

      <Campo campo="email" etiqueta="Email" error={errores.email}>
        <input type="email" autoComplete="email" placeholder="juan@email.com" {...props("email")} />
      </Campo>

      <Campo campo="telefono" etiqueta="Teléfono" error={errores.telefono}>
        <input type="tel" autoComplete="tel" placeholder="099123456" {...props("telefono")} />
      </Campo>

      <Campo campo="cedula" etiqueta="Cédula de identidad" opcional error={errores.cedula}>
        <input type="text" inputMode="numeric" placeholder="1.234.567-8" {...props("cedula")} />
      </Campo>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${claseEtiqueta} mb-2`}>Tipo de entrega</legend>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            ["domicilio", "Envío a domicilio"],
            ["agencia", "Retiro en agencia"],
          ].map(([valor, texto]) => (
            <label
              key={valor}
              className={`flex-1 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors ${
                form.tipoEntrega === valor ? "border-brand bg-white/70" : "border-[#1A1A1A]/15 bg-white/40"
              }`}
            >
              <input
                type="radio"
                name="tipoEntrega"
                value={valor}
                checked={form.tipoEntrega === valor}
                onChange={() => onCambio("tipoEntrega", valor)}
                className="accent-[#C89211]"
              />
              {texto}
            </label>
          ))}
        </div>
      </fieldset>

      <Campo campo="departamento" etiqueta="Departamento" error={errores.departamento}>
        <select autoComplete="address-level1" {...props("departamento")}>
          <option value="">Elegí un departamento</option>
          {DEPARTAMENTOS.map((departamento) => (
            <option key={departamento} value={departamento}>
              {departamento}
            </option>
          ))}
        </select>
      </Campo>

      <Campo campo="ciudad" etiqueta="Ciudad / localidad" error={errores.ciudad}>
        <input type="text" autoComplete="address-level2" placeholder="Pocitos" {...props("ciudad")} />
      </Campo>

      {esDomicilio ? (
        <Campo campo="direccion" etiqueta="Dirección" error={errores.direccion}>
          <input type="text" autoComplete="street-address" placeholder="Calle, número y apartamento" {...props("direccion")} />
        </Campo>
      ) : (
        <Campo
          campo="agencia"
          etiqueta="Agencia o sucursal de retiro"
          ayuda="Escribí el nombre de la agencia de transporte y la sucursal donde querés retirar."
          error={errores.agencia}
        >
          <input type="text" placeholder="Ej: DAC, sucursal Centro" {...props("agencia")} />
        </Campo>
      )}

      <Campo campo="comentario" etiqueta="Comentario" opcional error={errores.comentario}>
        <textarea rows={3} maxLength={MAX_COMENTARIO} placeholder="Ej: casa con rejas" {...props("comentario")} />
        <span className="text-xs text-[#888888] self-end">
          {form.comentario.length}/{MAX_COMENTARIO}
        </span>
      </Campo>
    </>
  );
}

export default FormularioEnvio;
