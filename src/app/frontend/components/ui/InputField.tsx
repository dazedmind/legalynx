import React from 'react'

function InputField({label, type, id, name, className, placeholder, value, onChange}: {label: string, type: string, id: string, name: string, className: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) {
  return (
    <div className='flex flex-col gap-2 w-sm p-2'>
        <label className='text-sm font-medium' htmlFor={id}>{label}</label>
        <input className={`w-auto p-2 border border-gray-300 rounded-md text-sm ${className}`} 
        type={type} 
        id={id} 
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
       />
    </div>
  )
}

export default InputField