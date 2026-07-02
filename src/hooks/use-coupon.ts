import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface CouponResult {
  valido: boolean
  desconto_valor?: number
  novo_total?: number
  erro?: string
}

export function useCoupon(
  planName: string | null,
  billingPeriod: 'mensal' | 'anual',
) {
  const [coupon, setCoupon] = useState('')
  const [debouncedCoupon, setDebouncedCoupon] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<CouponResult | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedCoupon(coupon), 500)
    return () => clearTimeout(handler)
  }, [coupon])

  useEffect(() => {
    async function validate() {
      if (!debouncedCoupon.trim() || !planName) {
        setResult(null)
        setIsValidating(false)
        return
      }
      setIsValidating(true)
      setResult(null)
      try {
        const { data, error } = await supabase.functions.invoke(
          'validar-cupom',
          {
            body: {
              cupom: debouncedCoupon,
              plano: planName,
              periodo: billingPeriod,
            },
          },
        )
        if (error) throw error
        if (data.valido) {
          setResult({
            valido: true,
            desconto_valor: data.desconto_valor,
            novo_total: data.novo_total,
          })
        } else {
          setResult({ valido: false, erro: data.erro || 'Cupom inválido' })
        }
      } catch {
        setResult({
          valido: false,
          erro: 'Erro ao validar cupom. Tente novamente.',
        })
      } finally {
        setIsValidating(false)
      }
    }
    validate()
  }, [debouncedCoupon, planName, billingPeriod])

  const clear = () => {
    setCoupon('')
    setDebouncedCoupon('')
    setResult(null)
  }

  const retry = () => {
    setDebouncedCoupon('')
    setTimeout(() => setDebouncedCoupon(coupon), 50)
  }

  return {
    coupon,
    setCoupon,
    debouncedCoupon,
    isValidating,
    result,
    clear,
    retry,
  }
}
