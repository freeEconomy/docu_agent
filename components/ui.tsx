'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { BrainCircuit, FileText, X } from 'lucide-react';
export function Brand({ enterprise = false }: { enterprise?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-icon">
        <BrainCircuit size={21} />
      </span>
      <strong>DocuMind</strong>
      {enterprise ? (
        <span className="text-primary font-normal">Enterprise</span>
      ) : (
        <span className="brand-tag">RAG Pro</span>
      )}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status}`}>
      {status === 'ready'
        ? '● 인덱싱 완료됨'
        : status === 'failed'
          ? '⊗ 파싱 실패 (보호/OCR)'
          : '● 처리중 (모의 임베딩)'}
    </span>
  );
}
export function FileIcon({ type = 'PDF' }: { type?: string }) {
  return (
    <span className={`file-icon ${type === 'PDF' ? 'pdf' : ''}`}>
      <FileText size={21} />
    </span>
  );
}
export function StatCard({
  label,
  value,
  suffix,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  detail: ReactNode;
  icon: ReactNode;
}) {
  return (
    <section className="card stat-card">
      <div className="row between muted">
        <span>{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="stat-value">
        {value} <span>{suffix}</span>
      </div>
      <div className="stat-detail">{detail}</div>
    </section>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="row between mb-5">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="창 닫기">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function downloadText(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
