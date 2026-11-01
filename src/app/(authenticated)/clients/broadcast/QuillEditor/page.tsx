'use client';
import { useTranslations } from 'next-intl';
import 'quill/dist/quill.snow.css';

import React, { useEffect, useRef } from 'react';

const QuillEditor = () => {
  const t = useTranslations('clients');
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null); // Usando apenas useRef para a instância
  const isInitialized = useRef(false); // Controla a inicialização para garantir que Quill só seja inicializado uma vez

  const initializeQuill = async () => {
    if (!isInitialized.current && editorRef.current) {
      try {
        const { default: Quill } = await import('quill');
        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ header: [1, 2, false] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'image', 'code-block']
            ]
          }
        });

        quillInstanceRef.current = quill; // Armazenando a instância no useRef
        isInitialized.current = true; // Marca que a inicialização foi feita
      } catch (error) {
        console.error('QuillEditor: Erro ao iniciar o Quill', error);
      }
    }
  };

  useEffect(() => {
    // Evitar inicialização múltipla do Quill
    if (!quillInstanceRef.current) {
      initializeQuill();
    }

    // Função de limpeza
    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current.destroy(); // Usando a instância de Quill do useRef
        quillInstanceRef.current = null; // Limpando a referência
      }
    };
  }, []); // O useEffect é executado uma vez durante a montagem do componente

  return (
    <div
      style={{
        borderRadius: '5px'
      }}
    >
      <div id="editor" ref={editorRef} />
      <button
        onClick={() => {
          const htmlContent = quillInstanceRef.current?.root.innerHTML;
        }}
      >
        {t('editors.getHtml')}
      </button>
    </div>
  );
};

export default QuillEditor;
