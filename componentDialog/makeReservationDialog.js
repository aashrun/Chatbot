    const { DialogSet, WaterfallDialog, ComponentDialog, ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt, DialogTurnStatus } = require("botbuilder-dialogs")

    const CHOICE_PROMPT = "CHOICE_PROMPT"
    const CONFIRM_PROMPT = "CONFIRM_PROMPT"
    const TEXT_PROMPT = "TEXT_PROMPT"
    const NUMBER_PROMPT = "NUMBER_PROMPT"
    const DATETIME_PROMPT = "DATETIME_PROMPT"
    const WATERFALL_DIALOG = "WATERFALL_PROMPT"
    let endDialog = ""


    class MakeReservationDialog extends ComponentDialog {
        constructor(conversationState, userState) {
            super("makeReservationDialog")
            

            this.addDialog(new TextPrompt(TEXT_PROMPT))
            this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
            this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator))
            this.addDialog(new DateTimePrompt(DATETIME_PROMPT))

            this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.firstStep.bind(this),
                this.getName.bind(this),
                this.getNumberOfParticipants.bind(this),
                this.getDate.bind(this),
                this.getTime.bind(this),
                this.confirmStep.bind(this),
                this.summaryStep.bind(this)
            ]))

            
            this.initialDialogId = WATERFALL_DIALOG

        }

        async run(turnContext, accessor) {
            const dialogSet = new DialogSet(accessor)
            dialogSet.add(this)

            const dialogContext = await dialogSet.createContext(turnContext)

            const results = await dialogContext.continueDialog()
            if (results.status === DialogTurnStatus.empty) {
                await dialogContext.beginDialog(this.id)
            }
        }

        async firstStep(step) {
            endDialog = false
            return await step.prompt(CONFIRM_PROMPT, "Would you like to make a reservation?", ["Yes", "No"])
        }

        async getName(step) {
            if (step.result == true) {
                return await step.prompt(TEXT_PROMPT, "Your good name? :)")
            }

        }

        async getNumberOfParticipants(step) {
            step.values.name = step.result
            return await step.prompt(NUMBER_PROMPT, "For how many people if I may ask?")
        }

        async getDate(step) {
            step.values.numberOfParticipants = step.result
            return await step.prompt(DATETIME_PROMPT, "For which date?")
        }

        async getTime(step) {
            step.values.date = step.result
            return await step.prompt(DATETIME_PROMPT, "At what time?", ["8:30AM", "9:30AM", "12PM", "3PM"])
        }

        async confirmStep(step) {
            step.values.time = step.result
            let message = `You have defined the following values: \n Name: ${step.values.name}, \n Total Participants: ${step.values.numberOfParticipants}, \n Date: ${JSON.stringify(step.values.date)}, \n Time: ${JSON.stringify(step.values.time)}`

            await step.context.sendActivity(message)

            return await step.prompt(CONFIRM_PROMPT, "Are you sure that all values are correct for you to make a reservation for the same?", ["Hell yeah! xD", "NAAAAAH! :("])
        }


        async summaryStep(step) {
            if (step.result === true) {
                //BUSINESS LOGIC

                await step.context.sendActivity("Your reservation has been successfully made!")

                endDialog = true
                return await step.endDialog()
            }
        }

        async noOfParticipantsValidator(promptContext){
            return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 8
        }


        async isDialogComplete(){
            return endDialog
        }

    }



    module.exports = { MakeReservationDialog }