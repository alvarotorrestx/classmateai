import { Link } from "react-router-dom"
import DefaultPageLayout from "../../components/layout/DefaultPageLayout"
import Button from "../../components/ui/Button"

const Register = () => {
  return (
    <DefaultPageLayout
      pageTitle="Create Account"
      title="Create a new account to get started."
      subtitle="Enter your email and a password to create a new account."
    >

      <form className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="font-semibold text-(--mint-700)"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="user@email.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="font-semibold text-(--mint-700)"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="password"
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
          />
        </div>

        {/* Buttons */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Link to="/" className="btn-secondary w-full sm:w-auto sm:min-w-40">
            Cancel
          </Link>

          <Button type='submit' variant='primary' className="w-full sm:w-auto sm:min-w-48">Create Account</Button>
          
        </div>
      </form>

    </DefaultPageLayout>
  )
}

export default Register