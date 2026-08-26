import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://app.fluc.com.br'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, password } = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      throw new Error('Server configuration error')
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Fluc seu novo Planejador Financeiro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #020817; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
          .header { background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0; }
          .logo { font-size: 24px; font-weight: 700; color: #020817; letter-spacing: -0.025em; display: flex; align-items: center; justify-content: center; }
          .logo span { background-color: #0f172a; color: #ffffff; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; margin-right: 8px; font-size: 18px; }
          .content { padding: 40px; }
          .greeting { font-size: 24px; font-weight: 700; color: #020817; margin-bottom: 16px; }
          .intro { margin-bottom: 32px; color: #64748b; font-size: 16px; }
          .section { margin-bottom: 24px; }
          .section-title { font-weight: 600; color: #020817; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
          .faq-item { margin-bottom: 20px; }
          .faq-q { font-weight: 600; color: #0f172a; margin-bottom: 6px; font-size: 15px; }
          .faq-a { color: #64748b; font-size: 14px; margin: 0; }
          .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; text-align: center; }
          .contact { background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 32px; text-align: center; font-size: 14px; color: #475569; }
          .contact a { color: #0f172a; font-weight: 600; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo"><span>F</span> Fluc</div>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${name || 'Usuário'}!</div>
            <p class="intro">Bem-vindo ao <strong>Fluc</strong>, seu novo Planejador Financeiro. Preparamos este guia rápido com base na nossa Central de Ajuda para você começar com o pé direito.</p>
            
            <div class="section">
              <div class="section-title">Como usar o Fluc</div>
              
              <div class="faq-item">
                <div class="faq-q">Como adiciono uma nova transação?</div>
                <p class="faq-a">Para adicionar uma nova transação, vá até a página "Transações" ou clique no botão "Nova Transação" na Dashboard. Preencha os detalhes como valor, categoria, data e se é uma receita ou despesa.</p>
              </div>

              <div class="faq-item">
                <div class="faq-q">Posso convidar outras pessoas para minha organização?</div>
                <p class="faq-a">Sim! Se você for um administrador, pode ir até a aba "Configurações", selecionar "Usuários" e enviar convites por e-mail para que outras pessoas acessem a mesma organização.</p>
              </div>

              <div class="faq-item">
                <div class="faq-q">Como altero a forma de pagamento de um registro?</div>
                <p class="faq-a">Você pode editar qualquer transação clicando nela na lista. Na janela de edição, você pode modificar a forma de pagamento, categoria, valor e outras informações.</p>
              </div>

              <div class="faq-item">
                <div class="faq-q">Meus dados estão seguros no Fluc?</div>
                <p class="faq-a">Com certeza. O Fluc utiliza criptografia de ponta a ponta e as melhores práticas de segurança do mercado para garantir que suas informações financeiras estejam sempre protegidas.</p>
              </div>
            </div>
            
            ${
              password
                ? `
            <div class="contact" style="background-color: #fffbeb; border: 1px solid #fde68a; color: #92400e; text-align: left;">
              <strong style="font-size: 16px;">Suas credenciais de acesso:</strong><br><br>
              E-mail: <strong>${email}</strong><br>
              Senha Temporária: <strong>${password}</strong><br><br>
              <em>⚠️ Por motivos de segurança, você será solicitado a alterar esta senha no seu primeiro acesso.</em>
            </div>
            `
                : ''
            }

            <center>
              <a href="${APP_URL}" class="btn">Acessar o Fluc Agora</a>
            </center>

            <div class="contact">
              Precisa de ajuda? Entre em contato pelo e-mail:<br>
              <a href="mailto:arcalabs.digital@gmail.com">arcalabs.digital@gmail.com</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Fluc. Todos os direitos reservados.</p>
            <p>Você está recebendo este e-mail porque se cadastrou na plataforma Fluc.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Fluc <contato@arcalabs.com.br>',
        to: [email],
        subject: 'Bem-vindo ao Fluc seu novo Planejador Financeiro',
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error('Resend API Error:', errorData)
      throw new Error(`Failed to send email: ${errorData}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
