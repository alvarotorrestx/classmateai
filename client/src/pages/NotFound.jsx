import { Link, useNavigate } from "react-router-dom";

import DefaultPageLayout from "../components/layout/DefaultPageLayout";
import Button from "../components/ui/Button";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <DefaultPageLayout
            pageTitle="404: Page Not Found"
            title="Page not found"
            subtitle="The page you&apos;re looking for doesn&apos;t exist or was moved."
        >
            <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-2xl border border-ui bg-(--surface-muted) p-6 sm:p-8">
                    <div className="inline-flex items-center rounded-full bg-(--error) px-4 py-1 font-semibold">
                        Error 404
                    </div>

                    <p className="body-large mt-4">
                        Try going back, or head to the home page and we&apos;ll route you to the
                        right place.
                    </p>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto sm:min-w-40"
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </Button>

                        <Link to="/" className="w-full sm:w-auto">
                            <Button variant="primary" className="w-full sm:w-auto sm:min-w-48">
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </DefaultPageLayout>
    );
}