const CLASE_CAMPO = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-slate-100'

function AdminZonaCampos({ departamentos, municipios, regiones, formulario, onChange }) {
  const municipiosVisibles = municipios.filter((municipio) => municipio.id_departamento === formulario.id_departamento)
  const regionesVisibles = regiones.filter((region) => region.id_municipio === formulario.id_municipio)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block text-sm font-semibold text-slate-700">
        Departamento
        <select required name="id_departamento" value={formulario.id_departamento} onChange={onChange} className={CLASE_CAMPO}>
          <option value="">Selecciona un departamento</option>
          {departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Municipio
        <select required disabled={!formulario.id_departamento} name="id_municipio" value={formulario.id_municipio} onChange={onChange} className={CLASE_CAMPO}>
          <option value="">Selecciona un municipio</option>
          {municipiosVisibles.map((municipio) => <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Región
        <select required disabled={!formulario.id_municipio} name="id_region" value={formulario.id_region} onChange={onChange} className={CLASE_CAMPO}>
          <option value="">Selecciona una región</option>
          {regionesVisibles.map((region) => <option key={region.id} value={region.id}>{region.nombre}</option>)}
        </select>
      </label>
    </div>
  )
}

export default AdminZonaCampos
