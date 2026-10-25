'use client';
import * as React from 'react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  instructorName?: string;
  completionDate?: string;
  workload?: string;
  certificateId?: string;
}

export function Certificate({ 
  studentName, 
  courseName, 
  instructorName = "Equipe Império", 
  completionDate = new Date().toLocaleDateString('pt-BR'),
  workload = "Carga Horária: 10h",
  certificateId = "IMP-1001"
}: CertificateProps) {
  return (
    <div className="max-w-4xl mx-auto border-[8px] border-double border-primary-foreground bg-white text-black p-12 relative overflow-hidden text-center shadow-2xl">
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary-foreground/10 rounded-br-full"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-tl-full"></div>
      
      <h1 className="text-4xl md:text-5xl font-serif uppercase tracking-widest text-primary-foreground mb-4">Certificado de Conclusão</h1>
      <p className="text-sm uppercase tracking-widest text-gray-500 mb-12">Academia Império</p>
      
      <p className="text-lg italic mb-4">Certificamos que</p>
      <h2 className="text-4xl font-bold uppercase tracking-wider mb-8">{studentName}</h2>
      <p className="text-lg italic mb-4">concluiu com êxito o curso profissional</p>
      <h3 className="text-2xl font-bold uppercase text-primary-foreground mb-12">{courseName}</h3>
      
      <div className="flex justify-between items-end mt-16 border-t border-gray-300 pt-8 px-8">
        <div className="text-left">
          <p className="text-sm font-bold">{instructorName}</p>
          <p className="text-xs text-gray-500 uppercase">Instrutor</p>
        </div>
        
        <div className="text-center">
          {/* Mock QR Code */}
          <div className="w-20 h-20 bg-gray-200 mx-auto mb-2 flex items-center justify-center p-2 border border-gray-300">
            <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-80 mix-blend-multiply"></div>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">ID: {certificateId}</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-bold">{completionDate}</p>
          <p className="text-xs text-gray-500 uppercase">Data de Conclusão</p>
          <p className="text-xs text-gray-500 uppercase mt-1">{workload}</p>
        </div>
      </div>
    </div>
  );
}
