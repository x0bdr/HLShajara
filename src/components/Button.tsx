type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Token-driven button. Variants: primary | secondary | ghost | danger. */
export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={`btn ${variant}${className ? ` ${className}` : ''}`} {...rest} />;
}
