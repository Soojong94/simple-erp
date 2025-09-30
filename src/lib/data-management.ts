// 🗑️ 데이터 관리 유틸리티 함수
// 전체 데이터 삭제 및 초기화 기능

import { customerAPI, productAPI, transactionAPI, inventoryAPI } from './tauri'

/**
 * 전체 데이터 초기화 (모든 데이터 삭제)
 * Settings 페이지에서 사용
 */
export const resetAllData = async (): Promise<boolean> => {
  try {
    const confirmation = window.confirm(
      '⚠️ 경고: 모든 데이터가 영구적으로 삭제됩니다!\n\n' +
      '삭제될 데이터:\n' +
      '- 모든 거래처\n' +
      '- 모든 상품\n' +
      '- 모든 거래 내역\n' +
      '- 모든 재고 정보\n' +
      '- 모든 거래처별 가격 정보\n\n' +
      '이 작업은 되돌릴 수 없습니다.\n' +
      '계속하시겠습니까?'
    )

    if (!confirmation) {
      return false
    }

    // 2차 확인
    const doubleCheck = window.prompt(
      '정말로 삭제하시겠습니까?\n' +
      '확인을 위해 "삭제확인"을 입력해주세요.'
    )

    if (doubleCheck !== '삭제확인') {
      alert('❌ 취소되었습니다.')
      return false
    }

    console.log('🗑️ 전체 데이터 초기화 시작...')

    // 1. 거래 내역 삭제
    const transactions = await transactionAPI.getAll()
    for (const tx of transactions) {
      if (tx.id) {
        await transactionAPI.delete(tx.id)
      }
    }
    console.log(`✅ 거래 ${transactions.length}건 삭제 완료`)

    // 2. 상품 삭제
    const products = await productAPI.getAll()
    for (const product of products) {
      if (product.id) {
        await productAPI.delete(product.id)
      }
    }
    console.log(`✅ 상품 ${products.length}개 삭제 완료`)

    // 3. 거래처 삭제
    const customers = await customerAPI.getAll()
    for (const customer of customers) {
      if (customer.id) {
        await customerAPI.delete(customer.id)
      }
    }
    console.log(`✅ 거래처 ${customers.length}개 삭제 완료`)

    // 4. localStorage의 모든 ERP 관련 데이터 제거
    const keys = Object.keys(localStorage)
    const erpKeys = keys.filter(key => 
      key.startsWith('simple-erp-') && 
      !key.includes('session') && 
      !key.includes('user')
    )
    
    erpKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    console.log(`✅ localStorage 키 ${erpKeys.length}개 삭제 완료`)

    console.log('✅ 전체 데이터 초기화 완료!')
    alert('✅ 모든 데이터가 삭제되었습니다.')
    
    return true

  } catch (error) {
    console.error('❌ 데이터 초기화 실패:', error)
    alert('❌ 데이터 초기화 중 오류가 발생했습니다.')
    return false
  }
}

/**
 * 거래처 전체 삭제
 * Customers 페이지에서 사용
 */
export const deleteAllCustomers = async (): Promise<boolean> => {
  try {
    const customers = await customerAPI.getAll()
    
    if (customers.length === 0) {
      alert('삭제할 거래처가 없습니다.')
      return false
    }

    const confirmation = window.confirm(
      `⚠️ ${customers.length}개의 거래처를 모두 삭제하시겠습니까?\n\n` +
      '연관된 거래 내역이 있으면 삭제할 수 없습니다.\n' +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmation) {
      return false
    }

    let deletedCount = 0
    let failedCount = 0

    for (const customer of customers) {
      if (customer.id) {
        try {
          await customerAPI.delete(customer.id)
          deletedCount++
        } catch (error) {
          console.error(`거래처 ${customer.name} 삭제 실패:`, error)
          failedCount++
        }
      }
    }

    if (failedCount > 0) {
      alert(
        `⚠️ 일부 거래처 삭제 실패\n\n` +
        `성공: ${deletedCount}개\n` +
        `실패: ${failedCount}개\n\n` +
        `연관된 거래 내역이 있는 거래처는 삭제할 수 없습니다.`
      )
    } else {
      alert(`✅ ${deletedCount}개의 거래처가 삭제되었습니다.`)
    }

    return true

  } catch (error) {
    console.error('❌ 거래처 전체 삭제 실패:', error)
    alert('❌ 거래처 삭제 중 오류가 발생했습니다.')
    return false
  }
}

/**
 * 상품 전체 삭제
 * Products 페이지에서 사용
 */
export const deleteAllProducts = async (): Promise<boolean> => {
  try {
    const products = await productAPI.getAll()
    
    if (products.length === 0) {
      alert('삭제할 상품이 없습니다.')
      return false
    }

    const confirmation = window.confirm(
      `⚠️ ${products.length}개의 상품을 모두 삭제하시겠습니까?\n\n` +
      '연관된 거래 내역이나 재고가 있으면 삭제할 수 없습니다.\n' +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmation) {
      return false
    }

    let deletedCount = 0
    let failedCount = 0

    for (const product of products) {
      if (product.id) {
        try {
          await productAPI.delete(product.id)
          deletedCount++
        } catch (error) {
          console.error(`상품 ${product.name} 삭제 실패:`, error)
          failedCount++
        }
      }
    }

    if (failedCount > 0) {
      alert(
        `⚠️ 일부 상품 삭제 실패\n\n` +
        `성공: ${deletedCount}개\n` +
        `실패: ${failedCount}개\n\n` +
        `연관된 거래 내역이나 재고가 있는 상품은 삭제할 수 없습니다.`
      )
    } else {
      alert(`✅ ${deletedCount}개의 상품이 삭제되었습니다.`)
    }

    return true

  } catch (error) {
    console.error('❌ 상품 전체 삭제 실패:', error)
    alert('❌ 상품 삭제 중 오류가 발생했습니다.')
    return false
  }
}

/**
 * 거래 전체 삭제
 * Transactions 페이지에서 사용
 */
export const deleteAllTransactions = async (): Promise<boolean> => {
  try {
    const transactions = await transactionAPI.getAll()
    
    if (transactions.length === 0) {
      alert('삭제할 거래가 없습니다.')
      return false
    }

    const confirmation = window.confirm(
      `⚠️ ${transactions.length}개의 거래를 모두 삭제하시겠습니까?\n\n` +
      '연관된 재고 이력도 함께 처리됩니다.\n' +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmation) {
      return false
    }

    let deletedCount = 0
    let failedCount = 0

    for (const tx of transactions) {
      if (tx.id) {
        try {
          await transactionAPI.delete(tx.id)
          deletedCount++
        } catch (error) {
          console.error(`거래 #${tx.id} 삭제 실패:`, error)
          failedCount++
        }
      }
    }

    if (failedCount > 0) {
      alert(
        `⚠️ 일부 거래 삭제 실패\n\n` +
        `성공: ${deletedCount}개\n` +
        `실패: ${failedCount}개`
      )
    } else {
      alert(`✅ ${deletedCount}개의 거래가 삭제되었습니다.`)
    }

    return true

  } catch (error) {
    console.error('❌ 거래 전체 삭제 실패:', error)
    alert('❌ 거래 삭제 중 오류가 발생했습니다.')
    return false
  }
}

/**
 * 재고 전체 초기화
 * Inventory 페이지에서 사용
 */
export const resetAllInventory = async (): Promise<boolean> => {
  try {
    const inventory = await inventoryAPI.getInventory()
    
    if (inventory.length === 0) {
      alert('초기화할 재고가 없습니다.')
      return false
    }

    const confirmation = window.confirm(
      `⚠️ ${inventory.length}개 상품의 재고를 모두 0으로 초기화하시겠습니까?\n\n` +
      '재고 이동 이력은 유지되며, 현재 재고량만 0으로 설정됩니다.\n' +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmation) {
      return false
    }

    let resetCount = 0

    for (const item of inventory) {
      try {
        await inventoryAPI.updateInventory({
          product_id: item.product_id,
          current_stock: 0,
          safety_stock: item.safety_stock,
          location: item.location,
          last_updated: new Date().toISOString()
        })
        resetCount++
      } catch (error) {
        console.error(`재고 초기화 실패 (상품 ID: ${item.product_id}):`, error)
      }
    }

    alert(`✅ ${resetCount}개 상품의 재고가 초기화되었습니다.`)
    return true

  } catch (error) {
    console.error('❌ 재고 초기화 실패:', error)
    alert('❌ 재고 초기화 중 오류가 발생했습니다.')
    return false
  }
}

/**
 * 데이터 통계 조회
 * Settings 페이지에서 사용
 */
export const getDataStats = async () => {
  try {
    const [customers, products, transactions, inventory] = await Promise.all([
      customerAPI.getAll(),
      productAPI.getAll(),
      transactionAPI.getAll(),
      inventoryAPI.getInventory()
    ])

    return {
      customers: customers.length,
      products: products.length,
      transactions: transactions.length,
      inventory: inventory.length
    }
  } catch (error) {
    console.error('데이터 통계 조회 실패:', error)
    return {
      customers: 0,
      products: 0,
      transactions: 0,
      inventory: 0
    }
  }
}
