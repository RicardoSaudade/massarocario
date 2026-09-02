import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type ButtonLinkProps = ComponentProps<typeof Link> & {
  tone?: 'primary' | 'secondary' | 'plain'
}

export function ButtonLink({ tone = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={`button button--${tone} ${className}`.trim()} {...props} />
}
