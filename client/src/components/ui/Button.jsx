export default function Button({
    children,
    variant = "primary",
    size = "",
    disabled = false,
    className = "",
    type = "button",
    ...props
}) {
    const variantClass =
        variant === "secondary"
            ? "btn-secondary"
            : variant === "ghost"
                ? "btn-ghost"
                : "btn-primary";

    const sizeClass =
        size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

    const disabledClass = disabled ? "btn-disabled" : "";

    const classes = [variantClass, sizeClass, disabledClass, className]
        .filter(Boolean)
        .join(" ");

    return (
        <button type={type} disabled={disabled} className={classes} {...props}>
            {children}
        </button>
    );
}