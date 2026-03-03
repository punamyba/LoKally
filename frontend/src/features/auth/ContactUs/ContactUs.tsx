import { useState } from "react";
import { useForm } from "react-hook-form";
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import { contactApi } from "./ContactApi";
import "./ContactUs.css";

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ mode: "onChange" });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        ...data,
        subject: (data.subject || "").trim() || "General Inquiry",
      };

      const res = await contactApi.submit(payload);

      if (res?.success) {
        reset();
        setSuccessMsg("Message sent. Our team will reply soon.");
      } else {
        setErrorMsg(res?.message || "Something went wrong.");
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Could not reach server.");
    }

    setLoading(false);
  };

  return (
    <div className="cu-page">
      <Navbar />

      <section className="cu-hero">
        <div className="cu-hero-inner">
          <h1 className="cu-title">Contact LoKally</h1>
          <p className="cu-subtitle">
            Found an issue on the map or want to suggest a place? Send us a message.
          </p>
        </div>
      </section>

      <main className="cu-main">
        <div className="cu-container">
          <div className="cu-card">
            <div className="cu-head">
              <h2>Send a message</h2>
              <p>We read every message. Please be as clear as possible.</p>
            </div>

            {successMsg && <div className="cu-alert cu-alert-ok">{successMsg}</div>}
            {errorMsg && <div className="cu-alert cu-alert-err">{errorMsg}</div>}

            <form className="cu-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="cu-row2">
                <div className="cu-field">
                  <label>Full name</label>
                  <input
                    placeholder="Your name"
                    {...register("name", {
                      required: "Name is required",
                      minLength: { value: 2, message: "Name must be at least 2 characters" },
                    })}
                    className={errors.name ? "cu-input cu-input-err" : "cu-input"}
                  />
                  {errors.name && <span className="cu-error">{errors.name.message}</span>}
                </div>

                <div className="cu-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Enter a valid email",
                      },
                    })}
                    className={errors.email ? "cu-input cu-input-err" : "cu-input"}
                  />
                  {errors.email && <span className="cu-error">{errors.email.message}</span>}
                </div>
              </div>

              <div className="cu-field">
                <label>Subject (optional)</label>
                <input
                  placeholder='Example: "Wrong place info"'
                  {...register("subject", {
                    maxLength: { value: 100, message: "Subject must be under 100 characters" },
                  })}
                  className={errors.subject ? "cu-input cu-input-err" : "cu-input"}
                />
                {errors.subject && <span className="cu-error">{errors.subject.message}</span>}
              </div>

              <div className="cu-field">
                <label>Message</label>
                <textarea
                  rows={6}
                  placeholder="Write your message..."
                  {...register("message", {
                    required: "Message is required",
                    minLength: { value: 10, message: "Message must be at least 10 characters" },
                    maxLength: { value: 500, message: "Message must be under 500 characters" },
                  })}
                  className={errors.message ? "cu-input cu-input-err" : "cu-input"}
                />
                {errors.message && <span className="cu-error">{errors.message.message}</span>}
              </div>

              <button className="cu-btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>

          <aside className="cu-side">
            <div className="cu-side-card">
              <h3>Response time</h3>
              <p>Usually within 24 hours (Sun–Fri).</p>
            </div>
            <div className="cu-side-card">
              <h3>Tip</h3>
              <p>
                If your issue is about a place, include the place name and location
                so we can find it quickly.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}