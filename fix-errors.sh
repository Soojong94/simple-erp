#!/bin/bash
# TypeScript 빌드 에러 자동 수정 스크립트

echo "TypeScript 에러 수정 중..."

# 1. src/lib/pdf/index.ts - setLineDash 수정
sed -i 's/doc\.setLineDash(\[3, 3\])/(doc as any).setLineDash([3, 3])/' src/lib/pdf/index.ts
sed -i 's/doc\.setLineDash(\[\])/(doc as any).setLineDash([])/' src/lib/pdf/index.ts

# 2. src/components/modals/ProductModal.tsx - unit_price 수정
sed -i "s/unit_price: product\.unit_price || ''/unit_price: product.unit_price ? String(product.unit_price) : ''/" src/components/modals/ProductModal.tsx

echo "수정 완료!"
echo "이제 npm run build를 실행하세요."
