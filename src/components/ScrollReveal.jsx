import useScrollReveal from '../hooks/useScrollReveal'

export default function ScrollReveal({ children, delay = 0, className = '' }) {
  const ref = useScrollReveal({ delay })
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
