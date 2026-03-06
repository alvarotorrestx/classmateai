import { Link } from "react-router-dom";

const InnerPageLayout = ({ title, subtitle, children }) => {
    return (
        <section className="w-full flex items-center justify-center max-w-500 mx-auto">
            <div className="w-full bg-(--surface) overflow-hidden">
                <header className="w-full bg-brand px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo/logo.png"
                            alt="ClassmateAI logo"
                            className="w-15 h-12 rounded-md bg-white p-1"
                        />

                        <Link to="/dashboard" className="text-white font-medium flex justify-center items-center gap-1">
                            <span className="text-4xl">←</span> Back to Dashboard
                        </Link>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-(--mint-400) flex items-center justify-center font-semibold text-(--mint-950)">
                        JC
                    </div>
                </header>

                <div className="px-6 py-4">
                    <div className="text-center mb-8">
                        <h2>{title}</h2>
                        {subtitle ? <p className="text-em mt-1">{subtitle}</p> : null}
                    </div>

                    {children}
                </div>
            </div>
        </section>
    );
};

export default InnerPageLayout;