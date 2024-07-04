const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeReservationDialog } = require("../componentDialog/makeReservationDialog")

class EchoBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        this.conversationState = conversationState
        this.userState = userState
        this.dialogState = conversationState.createProperty("dialogState")
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState)
        this.previousIntent = this.conversationState.createProperty("previousIntent")
        this.conversationData = this.conversationState.createProperty("conversationData")


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await this.dispatchToIntentAsync(context)
            await next();
        });



        this.onDialog(async (context, next) => {
            await this.conversationState.saveChanges(context, false)
            await this.userState.saveChanges(context, false)
            await next()
        })


        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

    }

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext

        for (let keys in activity.membersAdded) {
            if (activity.membersAdded[keys].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Restaurant Reservation Bot, ${activity.membersAdded[keys].name}!`
                await turnContext.sendActivity(welcomeMessage)
                return await this.sendSuggestedActions(turnContext)
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        let reply = MessageFactory.suggestedActions(["Make Reservations", "Cancel Reservations", "Restaurant Timings"], "What would you like to do today?")
        return await turnContext.sendActivity(reply)
    }

    async dispatchToIntentAsync(context) {
        let currentIntent
        const previousIntent = await this.previousIntent.get(context, {})
        const conversationData = await this.conversationData.get(context, {})

        if (previousIntent.intentName && conversationData.endDialog === false) {
            currentIntent = previousIntent.intentName

        } else if (previousIntent.intentName && conversationData.endDialog === true) {
            currentIntent = context.activity.text

        } else {
            currentIntent = context.activity.text
            await this.previousIntent.set(context, { intentName: context.activity.text })
        }

        switch (currentIntent) {

            case "Make Reservations":
                console.log("inside make reservation case")
                await this.conversationData.set(context, { endDialog: false })
                await this.makeReservationDialog.run(context, this.dialogState)
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete()

            default:
                console.log("Did not match the 'make reservation' case!")
                break;
        }
    }
}

module.exports.EchoBot = EchoBot;
