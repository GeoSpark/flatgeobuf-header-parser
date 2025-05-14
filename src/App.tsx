import './App.css'
import {PartialFileFetcher} from "./PartialFileFetcher.tsx";

function App() {
  return (
    <>
      <div>
          <PartialFileFetcher url={'https://geospark.github.io/flatgeobuf-header-parser/worldcover-stats-nuts-level0.fgb'}/>
      </div>
    </>
  )
}

export default App
