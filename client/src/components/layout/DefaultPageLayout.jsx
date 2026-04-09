const DefaultPageLayout = ({ pageTitle, title, subtitle, children }) => {
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

                        <span className="text-(--surface-muted) font-medium flex justify-center items-center gap-1">
                            {pageTitle}
                        </span>
                    </div>
                </header>

                <div className="px-6 py-4">
                    <div className="text-center mb-8">
                        <h1>{title}</h1>
                        {subtitle ? <p className="text-em mt-1">{subtitle}</p> : null}
                    </div>

                    {children}
                </div>
            </div>
        </section>
    );
};

export default DefaultPageLayout;