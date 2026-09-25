# bonsai/onsen

**日本の温泉を、最も詳しく・再利用可能な形で記録するオープンデータ基盤。**

`bonsai/onsen` は、温泉地・源泉・施設・浴場・泉質・化学成分・匂い・飲泉・湯治場・位置・営業状態・歴史・情報源を統合し、**検索できるDB**から**AIが利用できるデータ基盤**までを構築するプロジェクトです。

> Goal: 日本最大級の温泉DB → 日本一を検証できる温泉DB

## Vision

単なる「温泉施設一覧」ではなく、

```
source → observation → entity → latest → now → action
```

というデータモデルで、日本の温泉を**時系列・出典付き・再利用可能**なデータとして蓄積します。

対象:
- 温泉地
- 源泉
- 旅館・ホテル
- 日帰り温泉
- 公衆浴場
- 浴槽・浴場
- 泉質
- 化学成分
- 匂い
- 飲泉
- 湯治場
- 温度
- 湧出量
- 地理情報
- 営業状態
- 改名・移転・閉館などの履歴
- 情報源
- 観測データ

## Architecture

```
                         ┌───────────────┐
                         │   Ontology    │
                         │ type / schema │
                         └───────┬───────┘
                                 │
                                 ▼
Public Sources → Observation → ONsen DB
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
             API                MCP                CLI
              │                  │                  │
              ▼                  ▼                  ▼
             SDK                AI                  AW
              │
              ▼
             CRX
              │
              ▼
       Pages / Dashboard
```

## Data Model

Core entities:

```
prefecture
area
resort
spring
facility
bath
quality
chemistry
odor
drinking
toji
source
observation
```

**EntityとObservationを分離します。**

例えば「源泉温度が48.2℃」は、ある時点・ある情報源から得られた観測値として保存します。

```json
{
  "entity_id": "spring:xxx",
  "observed_at": "2026-09-25",
  "source_id": "source:env",
  "temperature_c": 48.2
}
```

これにより現在値・最新値・過去値・変更履歴・情報源を同時に保持できます。

### Chemistry

化学成分は独立した観測データとして保持します。

```json
{
  "spring_id": "spring:xxx",
  "substance": "hydrogen_sulfide",
  "name_ja": "硫化水素",
  "concentration": 12.4,
  "unit": "mg/L",
  "observed_at": "2026-09-25",
  "source_id": "source:xxx"
}
```

候補項目:
- 硫化水素
- 総硫黄
- ナトリウム
- カルシウム
- マグネシウム
- 塩化物
- 硫酸塩
- 炭酸水素塩
- 二酸化炭素
- 鉄
- メタケイ酸
- メタホウ酸
- ラドン
- pH
- 電気伝導度

### Odor

匂いは、統制語彙と自由記述を分離します。

```yaml
odor:
  category: sulfur
  intensity:
  descriptor:
  method:
  observed_at:
  source_id:
```

候補カテゴリ:
`sulfur`, `chlorine`, `iron`, `petroleum`, `organic`, `earthy`, `mineral`, `none`, `other`

化学成分と匂いを別Entity/Observationとして持つことで、将来的に**成分 ↔ 匂いの相関分析**が可能になります。

### Drinking / 飲泉

飲泉は「公式に飲泉可能か」と「化学的な可能性」を混同しません。

```yaml
drinking:
  official_status: permitted
  evidence:
    source_id:
  observed_at:
```

`official_status`:
- `permitted` — 飲泉可
- `prohibited` — 飲泉不可
- `restricted` — 条件付き
- `unknown` — 不明

化学成分だけからAIが飲泉可否を推定するのではなく、公式情報・濃度・条件・施設案内等の根拠を保持します。

### Toji / 湯治場

**湯治場は温泉地・施設とは別の利用文化Entity**として扱います。

```yaml
toji:
  status: active
  tradition:
  purpose:
  stay_type:
  treatment:
  historical_period:
  duration:
  facilities:
  source_id:
  observed_at:
```

`status`:
- `active` — 現在も湯治場として利用
- `historical` — 歴史的湯治場
- `seasonal` — 季節営業・季節湯治
- `revival` — 復興・再生型
- `unknown` — 不明

これにより、現在の湯治場だけでなく**歴史的な湯治場・湯治文化**も同じDBで記録できます。

```
温泉地 (resort)
   └── 湯治場 (toji)
          ├── 源泉
          ├── 宿
          ├── 浴場
          ├── 滞在形態
          └── 歴史
```

## Canonical Data

データ交換の中心は **JSONL** とします。

```
data/
├── prefectures.jsonl
├── areas.jsonl
├── resorts.jsonl
├── springs.jsonl
├── facilities.jsonl
├── baths.jsonl
├── qualities.jsonl
├── chemistry.jsonl
├── odors.jsonl
├── drinking.jsonl
├── toji.jsonl
├── sources.jsonl
└── observations.jsonl
```

DB固有の形式に依存せず、JSONLから各DB・API・SDKへ展開できる構造を目指します。

## Source & Provenance

すべてのデータについて、可能な限り出典を保持します。

```
source
├── publisher
├── url
├── title
├── license
├── fetched_at
└── source_type
```

公的情報、自治体、温泉地・観光協会、施設公式等を優先し、出典と取得時点を失わないことを重視します。

## Data Pipeline

```
discover
   ↓
fetch
   ↓
parse
   ↓
normalize
   ↓
identify
   ↓
observe
   ↓
dedupe
   ↓
validate
   ↓
latest
   ↓
dashboard / API
```

GitHub Actions / AW によって定期的に実行します。

## Entity Resolution

名称・住所・URL等の揺れを解決するため、以下を組み合わせてentityを同定します。

- official ID
- URL
- 電話番号
- 住所
- 緯度経度
- 正規化名称
- alias

自動統合できないものは **merge candidate** として残し、誤統合を防ぎます。

## Interfaces

### CLI

```bash
onsen search 草津
onsen get <id>
onsen nearby <lat> <lng>
onsen history <id>
onsen latest
onsen crawl
onsen validate
onsen dedupe
onsen import
onsen export
```

### REST API

```
GET /onsen
GET /onsen/{id}
GET /resorts
GET /springs
GET /facilities
GET /baths
GET /qualities
GET /chemistry
GET /odors
GET /drinking
GET /toji
GET /observations
GET /sources
GET /nearby
GET /history/{id}
GET /latest
```

API contractは **OpenAPI** を正典とします。

### SDK

- TypeScript
- Python
- Go

APIと同じschemaを共有します。

### MCP

AIから温泉DBを利用できるようにします。

```
search_onsen
get_onsen
search_spring
search_facility
search_toji
search_chemistry
search_odor
search_drinking
nearby_onsen
get_history
get_source
compare_onsen
```

### CRX

Chromeで閲覧中の温泉情報を、

```
page → extract → identify → existing entity → observation candidate
```

としてDBへ取り込めるようにします。

## Database

用途に応じて複数のストレージを利用できる構成にします。

```
JSONL
 ├── SQLite      local / development
 ├── PostgreSQL  API / production
 └── BigQuery    large-scale analytics
```

**Canonical dataとDB implementationを分離する**ことが重要です。

## Data Quality

規模だけでなく品質を測定します。

- schema validity
- required fields
- duplicate rate
- geocode rate
- source coverage
- provenance rate
- freshness
- broken URLs
- orphan relations
- invalid coordinates

GitHub ActionsでDQチェックを実行し、結果をJSON / HTMLとして保存します。

## Dashboard

GitHub Pages等でJSON-firstの探索画面を提供します。

- 全国地図
- 都道府県
- 市区町村
- 温泉地
- 源泉
- 施設
- 泉質
- 化学成分
- 匂い
- 飲泉
- 湯治場
- 温度
- 湧出量
- 更新履歴

ランキングだけではなく、**データそのものを探索できるDashboard**を目指します。

## Scale

「日本一」を検証可能なKPIとして定義します。

```yaml
coverage:
  prefectures:
  municipalities:
  resorts:
  springs:
  facilities:
  baths:
  toji_sites:

quality:
  provenance:
  geocoded:
  validated:
  fresh:
  duplicate_free:

history:
  observations:
  historical_entities:
```

他DBと比較する場合は、同一定義・同一時点・同一母集団を揃えて比較します。

## Repository Structure

```
onsen/
├── api/
├── cmd/
├── crawlers/
├── crx/
├── data/
├── db/
├── dedupe/
├── docs/
├── mcp/
├── ontology/
├── analysis/
├── sdk/
├── seeds/
├── web/
└── .github/
    └── workflows/
```

## Roadmap

設計はGitHub Issuesに分割しています。

1. Ontology / Entity Model
2. Canonical JSONL Data Layer
3. Official Source Seed
4. Crawler / Observation Pipeline
5. Deduplication
6. Historical / Latest / Now
7. Database Backend
8. REST API / OpenAPI
9. SDKs
10. MCP Server
11. Chrome Extension / CRX
12. CLI
13. Validation / Data Quality
14. Analytics / Dashboard
15. GitHub Actions / AW Automation
16. Public API / Developer Platform
17. Scale / Coverage KPI
18. Documentation / Architecture

## Development Principle

- **JSON first** — JSONLをcanonical exchange formatにする
- **Source first** — provenanceを残す
- **Observation first** —現在値だけでなく履歴を残す
- **ID first** — stable IDでentityを管理
- **API first** — OpenAPIをcontractにする
- **AI ready** — MCPから利用可能にする
- **Browser ready** — CRXから収集可能にする
- **Automation first** — GitHub Actions / AWで継続更新する

## Long-term Goal

`bonsai/onsen` を、

> **日本の温泉について「検索する」「調べる」「分析する」「収集する」「AIに質問する」「APIで使う」を一つのデータ基盤で可能にする。**

ためのオープンな温泉データ基盤にする。

**GH is canon.**

Issue → implementation → workflow evidence → data → docs の順で、DBを継続的に成長させます。
