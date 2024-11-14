export class FormStep {
    public title: string;
    public index: number;
    public stepType: StepType;
    

    constructor(title: string, index: number, stepType: StepType) {
        this.title = title;
        this.index = index;
        this.stepType = stepType;
    }
}

export enum StepType {
    Market = 'Market',
    Location = 'Location',
    Features = 'Features',
    Type = 'Type',
    Impact = 'Impact',
    Window = 'Window',
    Description = 'Description',
    SpecialNotes = 'Special Notes',
    ReplyTo = 'Reply To'
}
