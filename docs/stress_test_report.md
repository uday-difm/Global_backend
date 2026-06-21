# Global Backend CMS - Stress Testing & Rate Limiting Report

This report documents the performance metrics, load capacities, and security rate limiter behavior of the Global Backend CMS. The tests were run locally against the development server (`http://localhost:3000`) using the native, lightweight ESM runner `scratch/stress-test.mjs`.

---

## Executive Summary

1. **Catch-All Page Rendering (`/hey`)**: Renders fully published CMS pages. Sustained a load of **7.02 RPS** with 100% success rate under a concurrency of 10. Next.js dev server compilation/JIT overhead accounts for the latency profile (~1.42s mean).
2. **Public Content API (`/api/content`)**: Handles headless database queries. High performance profile, sustaining **71.75 RPS** with 100% success rate under a concurrency of 15 and a mean response time of **205.0ms**.
3. **Rate Limiter Validation (`/api/admin/redirects`)**: Confirmed rate limiter efficacy. By setting `rateLimitRps: 10` in the database, the test suite sent 30 requests sequentially. Exactly 10 requests returned `200 OK`, and all remaining 20 requests were correctly blocked with `429 Too Many Requests`. Reverted back to default (60 RPS) upon test completion.

---

## Detailed Test Run Results

### Test Suite 1: Catch-All Page Load (/hey)
- **Target URL**: `http://localhost:3000/hey`
- **Total Requests**: 200
- **Concurrency**: 10
- **Duration**: 28.475 seconds
- **Throughput**: 7.02 Requests/Sec (RPS)
- **Success Rate**: 100.0% (`200 OK`: 200, `Failures`: 0)
- **Latency Profile**:
  - **Mean Latency**: 1421.7ms
  - **p50 (Median)**: 1392ms
  - **p90**: 1750ms
  - **p95**: 1801ms
  - **p99**: 1944ms
- **Key Observation**: Correctly resolved page slugs from the database (supporting both trailing-slash and non-trailing-slash definitions) and successfully returned visual sections (Hero, Text Blocks, etc.).

---

### Test Suite 2: Public Content API (/api/content)
- **Target URL**: `http://localhost:3000/api/content?siteId=cmqjbvc3i0000pgw2t202klem&slug=hey`
- **Total Requests**: 300
- **Concurrency**: 15
- **Duration**: 4.181 seconds
- **Throughput**: 71.75 Requests/Sec (RPS)
- **Success Rate**: 100.0% (`200 OK`: 300, `Failures`: 0)
- **Latency Profile**:
  - **Mean Latency**: 205.0ms
  - **p50 (Median)**: 183ms
  - **p90**: 312ms
  - **p95**: 426ms
  - **p99**: 578ms
- **Key Observation**: Extremely stable and fast. This headless API is ready for high-concurrency client-side data fetching.

---

### Test Suite 3: Rate Limiter Validation
- **Target URL**: `http://localhost:3000/api/admin/redirects`
- **Configured DB Limit**: 10 Requests Per Second (RPS)
- **Total Requests**: 30
- **Concurrency**: 8
- **Duration**: 2.285 seconds
- **Throughput**: 13.13 Requests/Sec (RPS)
- **Success Rate**: 33.3% (`200 OK`: 10, `429 Too Many Requests`: 20)
- **Status Code Breakdown**:
  - `200`: 10
  - `429`: 20
- **Latency Profile**:
  - **Mean Latency**: 595.5ms
  - **p50 (Median)**: 125ms
  - **p90**: 1979ms
  - **p95**: 1993ms
  - **p99**: 2020ms
- **Efficacy Conclusion**: **PASS**. The sliding-window rate limiter correctly blocked requests when the 10 RPS threshold was crossed from the same client IP (`192.168.1.99`), returning the standardized HTTP `429 Too Many Requests` status code. Reverted back to the default (60 RPS) setting.

---

## Recommendations & Next Steps

1. **Production Build Testing**: The tests were run in development mode. In production (`npm run build && npm run start`), Next.js utilizes static optimization and precompiles server components. The catch-all page load latency is expected to drop from ~1.4s to <50ms, with RPS climbing into the hundreds.
2. **Database Pooling**: For environments with high concurrency (>50 parallel users), ensure PostgreSQL's max connection limit is configured to at least `100` and the Prisma client connection pool size is adjusted (`?connection_limit=50` in `DATABASE_URL`) to prevent thread hangs.
