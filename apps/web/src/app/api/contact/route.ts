import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if Resend is configured
    if (!resend) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json({ error: "Email service is not configured" }, { status: 500 });
    }

    console.log("Attempting to send email to:", process.env.RESEND_TO_EMAIL);
    console.log("From:", name, email);

    // Send email using Resend
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WhataGoodDealTX Contact <onboarding@resend.dev>",
      to: [process.env.RESEND_TO_EMAIL || "jason.cochran@strataga.io"],
      replyTo: email,
      subject: `New Contact from ${name} - WhataGoodDealTX`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: 'Indie Flower', cursive, sans-serif;
                line-height: 1.6;
                color: #2D2D2D;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #89CFF0 0%, #FFDAB9 100%);
              }
              .postcard {
                background: #fff8dc;
                border: 12px solid #8b4513;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                font-family: 'Satisfy', cursive;
                color: #ff6b9d;
                font-size: 36px;
                margin: 0 0 10px 0;
                text-shadow: 3px 3px 0 rgba(0,0,0,0.1);
              }
              .stamp {
                display: inline-block;
                background: #ff6b9d;
                color: white;
                padding: 5px 15px;
                border: 3px dashed #ffd93d;
                border-radius: 5px;
                font-size: 14px;
                font-weight: bold;
              }
              .field {
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(255,255,255,0.5);
                border-left: 4px solid #4dabf7;
                border-radius: 5px;
              }
              .label {
                font-weight: 600;
                color: #ff6b9d;
                font-size: 14px;
                margin-bottom: 5px;
              }
              .value {
                color: #2d2d2d;
                font-size: 16px;
              }
              .message-box {
                background: rgba(77, 171, 247, 0.1);
                padding: 20px;
                border: 4px solid #4dabf7;
                border-radius: 15px;
                margin-top: 20px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 3px dashed #8b4513;
                text-align: center;
                font-size: 14px;
                color: #8b4513;
              }
            </style>
          </head>
          <body>
            <div class="postcard">
              <div class="header">
                <h1>New Postcard from WhataGoodDealTX!</h1>
                <div class="stamp">NEW MESSAGE</div>
              </div>

              <div class="field">
                <div class="label">From:</div>
                <div class="value">${name}</div>
              </div>

              <div class="field">
                <div class="label">Reply To:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>

              <div class="message-box">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, "<br>")}</div>
              </div>

              <div class="footer">
                <p>✉️ Delivered from WhataGoodDealTX website ✉️</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Failed to send email", details: error }, { status: 500 });
  }
}
