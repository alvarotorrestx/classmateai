import { Link } from "react-router-dom"

const Landing = () => {
    return (
        <section className="w-full min-h-screen flex flex-col items-center justify-center">

            {/* Logo */}
            <img
                src="/images/logo/logo.png"
                alt="Classmate AI logo"
                className="w-[260px] sm:w-[420px]"
            />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-50 mt-12 w-full max-w-xl">

                <Link
                    to="/login"
                    className="btn-secondary flex justify-center w-full"
                >
                    Sign In
                </Link>

                <Link
                    to="/register"
                    className="btn-secondary flex justify-center w-full"
                >
                    Create Account
                </Link>

            </div>
        </section>
    )
}

export default Landing