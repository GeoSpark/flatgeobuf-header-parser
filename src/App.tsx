import './App.css'
import {PartialFileFetcher} from "./PartialFileFetcher.tsx";

function App() {
  return (
    <>
      <div>
          <PartialFileFetcher url={'https://sparkgeo.github.io/fgb-metadata-injector/worldcover-stats-nuts-level0.fgb'}/>
      </div>
    </>
  )
}

export default App
