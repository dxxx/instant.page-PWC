/**
 * Security Test: Verify HTML escaping prevents XSS
 *
 * This test verifies that the escapeHTMLTags function properly
 * escapes all HTML special characters to prevent XSS attacks.
 */

// Import or copy the escapeHTMLTags function
function escapeHTMLTags(html) {
  // Escape all HTML special characters to prevent XSS
  // Must escape & first to avoid double-escaping
  return html
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Test cases
const tests = [
  {
    name: 'Single < and > characters',
    input: '<script>',
    expected: '&lt;script&gt;',
  },
  {
    name: 'Multiple < and > characters (XSS attempt)',
    input: '<<script>alert(1)</script>',
    expected: '&lt;&lt;script&gt;alert(1)&lt;/script&gt;',
  },
  {
    name: 'Attribute injection with quotes',
    input: '" onclick="alert(1)" foo="',
    expected: '&quot; onclick=&quot;alert(1)&quot; foo=&quot;',
  },
  {
    name: 'Single quotes',
    input: "' onclick='alert(1)' foo='",
    expected: '&#39; onclick=&#39;alert(1)&#39; foo=&#39;',
  },
  {
    name: 'Ampersands',
    input: '&lt;&gt;',
    expected: '&amp;lt;&amp;gt;',
  },
  {
    name: 'Mixed special characters',
    input: '<a href="test&foo=bar">',
    expected: '&lt;a href=&quot;test&amp;foo=bar&quot;&gt;',
  },
  {
    name: 'Normal text (no escaping needed)',
    input: 'hello world',
    expected: 'hello world',
  },
]

// Run tests
console.log('🔒 Security Test: HTML Escaping\n')
let passed = 0
let failed = 0

tests.forEach((test) => {
  const result = escapeHTMLTags(test.input)
  const success = result === test.expected

  if (success) {
    passed++
    console.log(`✅ ${test.name}`)
  } else {
    failed++
    console.log(`❌ ${test.name}`)
    console.log(`   Input:    ${test.input}`)
    console.log(`   Expected: ${test.expected}`)
    console.log(`   Got:      ${result}`)
  }
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All security tests passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some tests failed - security vulnerability detected!')
  process.exit(1)
}
