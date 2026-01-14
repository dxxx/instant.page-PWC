/**
 * Cache Test: Verify FIFO eviction prevents unbounded memory growth
 *
 * This test simulates the prefetch cache behavior to ensure:
 * 1. Cache size never exceeds MAX_PREFETCH_HISTORY
 * 2. Oldest entries are evicted first (FIFO)
 * 3. Duplicate prevention still works within cache limit
 */

// Simulate the cache logic from instantpage.js
const MAX_PREFETCH_HISTORY = 100
let _preloadedList = new Set()
let preloadCallCount = 0

function preload(url) {
  if (_preloadedList.has(url)) {
    return false // Already prefetched
  }

  // Implement FIFO cache eviction
  if (_preloadedList.size >= MAX_PREFETCH_HISTORY) {
    const oldestUrl = _preloadedList.values().next().value
    _preloadedList.delete(oldestUrl)
  }

  _preloadedList.add(url)
  preloadCallCount++
  return true // Actually prefetched
}

// Test suite
console.log('🗄️  Cache Test: FIFO Eviction\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`✅ ${name}`)
  } catch (error) {
    failed++
    console.log(`❌ ${name}`)
    console.log(`   Error: ${error.message}`)
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

// Test 1: Cache starts empty
test('Cache starts empty', () => {
  assertEquals(_preloadedList.size, 0, 'Initial size')
})

// Test 2: Adding URLs increases cache size
test('Adding URLs increases cache size', () => {
  preload('/page1')
  preload('/page2')
  preload('/page3')
  assertEquals(_preloadedList.size, 3, 'Size after 3 adds')
})

// Test 3: Duplicate prevention works
test('Duplicate prevention works', () => {
  const beforeSize = _preloadedList.size
  const beforeCount = preloadCallCount
  const result = preload('/page1') // Already added
  assertEquals(_preloadedList.size, beforeSize, 'Size unchanged')
  assertEquals(preloadCallCount, beforeCount, 'No new prefetch')
  assertEquals(result, false, 'Returns false for duplicate')
})

// Test 4: Cache grows up to limit
test('Cache grows up to MAX_PREFETCH_HISTORY', () => {
  _preloadedList = new Set()
  for (let i = 0; i < MAX_PREFETCH_HISTORY; i++) {
    preload(`/page${i}`)
  }
  assertEquals(_preloadedList.size, MAX_PREFETCH_HISTORY, 'Size at max')
})

// Test 5: Exceeding limit triggers eviction
test('Exceeding limit triggers FIFO eviction', () => {
  // Cache is now at MAX_PREFETCH_HISTORY from previous test
  // First URL was /page0
  const hasPageZeroBefore = _preloadedList.has('/page0')
  assertEquals(hasPageZeroBefore, true, 'page0 exists before')

  // Add one more
  preload('/new-page')

  const hasPageZeroAfter = _preloadedList.has('/page0')
  const hasNewPage = _preloadedList.has('/new-page')
  const size = _preloadedList.size

  assertEquals(hasPageZeroAfter, false, 'page0 evicted (oldest)')
  assertEquals(hasNewPage, true, 'new-page added')
  assertEquals(size, MAX_PREFETCH_HISTORY, 'Size still at max')
})

// Test 6: FIFO order is maintained
test('FIFO order is maintained across multiple evictions', () => {
  // Add 5 more URLs, should evict page1-page5
  for (let i = 0; i < 5; i++) {
    preload(`/newer-page${i}`)
  }

  // page0-page5 should be gone (6 URLs evicted total)
  for (let i = 0; i < 6; i++) {
    const exists = _preloadedList.has(`/page${i}`)
    assertEquals(exists, false, `page${i} evicted`)
  }

  // page6 should still exist (7th URL, within limit)
  const hasPage6 = _preloadedList.has('/page6')
  assertEquals(hasPage6, true, 'page6 still cached')

  assertEquals(_preloadedList.size, MAX_PREFETCH_HISTORY, 'Size maintained')
})

// Test 7: Memory efficiency estimate
test('Memory usage stays bounded', () => {
  // Average URL length ~100 chars, each char is 2 bytes in JS
  // Set overhead ~32 bytes per entry
  // Estimated: 100 * (100 * 2 + 32) = 23,200 bytes ≈ 23KB
  const estimatedBytesPerUrl = 232
  const estimatedTotalBytes = MAX_PREFETCH_HISTORY * estimatedBytesPerUrl
  const estimatedKB = Math.round(estimatedTotalBytes / 1024)

  console.log(`   📊 Estimated max memory: ~${estimatedKB}KB`)
  assertEquals(_preloadedList.size <= MAX_PREFETCH_HISTORY, true, 'Size bounded')
})

// Test 8: Edge case - single element cache
test('Edge case: works with limit of 1', () => {
  const miniCache = new Set()
  const MINI_LIMIT = 1

  function miniPreload(url) {
    if (miniCache.has(url)) return false
    if (miniCache.size >= MINI_LIMIT) {
      const oldest = miniCache.values().next().value
      miniCache.delete(oldest)
    }
    miniCache.add(url)
    return true
  }

  miniPreload('/a')
  assertEquals(miniCache.size, 1, 'Size 1')
  assertEquals(miniCache.has('/a'), true, 'Has /a')

  miniPreload('/b')
  assertEquals(miniCache.size, 1, 'Size still 1')
  assertEquals(miniCache.has('/a'), false, '/a evicted')
  assertEquals(miniCache.has('/b'), true, 'Has /b')
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All cache tests passed!')
  console.log('✅ FIFO eviction prevents unbounded memory growth')
  process.exit(0)
} else {
  console.log('⚠️  Some tests failed - cache implementation needs fixing!')
  process.exit(1)
}
