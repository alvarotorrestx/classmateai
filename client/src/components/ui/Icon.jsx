export default function Icon({
    src,
    alt = "",
    size = 48,
    className = "",
}) {
    return (
        <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={`inline-block ${className}`}
            loading="lazy"
            draggable="false"
        />
    );
}