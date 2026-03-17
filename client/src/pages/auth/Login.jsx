import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"

import DefaultPageLayout from "../../components/layout/DefaultPageLayout"
import Button from "../../components/ui/Button"

import { loginUser } from "../../services/authService"
import useAuth from "../../hooks/useAuth"

const Login = () => {

  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await loginUser({
        email,
        password
      })

      setAuth({ user: data.user })

      navigate("/dashboard")

    } catch (err) {
      if (!err?.response) {
        setError("No Server Response");
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        setError(err.response?.data?.detail || "Invalid email or password.");
      } else {
        setError("Login Failed");
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DefaultPageLayout
      pageTitle="Sign In"
      title="Sign Into your account"
      subtitle="Sign in with your email and password below."
    >

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6">

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
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
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
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">

          <Link
            to="/"
            className={loading ? "pointer-events-none" : ""}
          >
            <Button
              variant="secondary"
              className="w-full sm:w-auto sm:min-w-40"
              disabled={loading}
            >
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto sm:min-w-48"
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign In"}
          </Button>

        </div>

        {error && (
          <div className="text-error body-small sm:text-right">
            {error}
          </div>
        )}

      </form>

    </DefaultPageLayout>
  )
}

export default Login