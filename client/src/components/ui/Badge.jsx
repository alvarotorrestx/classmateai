export default function Badge({
    children,
    variant = "correct",
    className = "",
    ...props
}) {
    const variantClass =
        variant === "review"
            ? "badge-review"
            : variant === "progress"
                ? "badge-progress"
                : "badge-correct";

    const classes = ["badge", variantClass, className]
        .filter(Boolean)
        .join(" ");

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
}