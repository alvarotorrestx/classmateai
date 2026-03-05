// Icon import and test examples
import Icon from "./components/ui/Icon"
import flashcard from './assets/icons/core/flashcard.svg'
import ai_processing from './assets/icons/core/ai_processing.svg'
import quiz from './assets/icons/core/quiz.svg'
import study_session from './assets/icons/core/study_session.svg'
import upload_notes from './assets/icons/core/upload_notes.svg'

// Button import and test examples
import Button from "./components/ui/Button"


function App() {

  return (
    <>
      <Icon src={flashcard} />
      <Icon src={ai_processing} />
      <Icon src={quiz} />
      <Icon src={study_session} />
      <Icon src={upload_notes} />

      <Button>Generate Flashcards</Button>
      <Button variant="secondary">Upload Notes</Button>
      <Button variant="ghost" disabled>Cancel</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
    </>
  )
}

export default App
