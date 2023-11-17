import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Dropdown, MenuProps, message } from "antd";
import React from "react";
import AIKeyConfigDialog from "./AIKeyConfigDialog";
import { apiKey, deployment, dropdownMenus, endpoint, generateText } from "./utility/AIData";
import { predefinedCitation, predefinedComment, predefinedDocumentTemplateBase64, predefinedPictureBase64, predefinedTitle } from "./utility/PredefinedData";

// global variable to store the EndPoint/Deployment/ApiKey, configrued by developer
export let _apiKey = "";
export let _endpoint = "";
export let _deployment = "";

export default class Home extends React.Component {
    constructor(props, context) {
        super(props, context);
    }

    state = {
        displayMainFunc: false,
        openKeyConfigDialog: false,
        titleLoading: false,
        commentLoading: false,
        citationLoading: false,
        pictureLoading: false,
        formatLoading: false,
        importTemplateLoading: false,
    }

    openMainFunc = () => {
        this.setState({ displayMainFunc: true });
    }

    back = () => {
        this.setState({ displayMainFunc: false });
    }

    open = (isOpen: boolean) => {
        this.setState({ openKeyConfigDialog: isOpen });
    }

    setKey = (key: string) => {
        _apiKey = key;
    }

    setEndpoint = (endpoint: string) => {
        _endpoint = endpoint;
    }

    setDeployment = (deployment: string) => {
        _deployment = deployment;
    }

    //This is the code interacting with the Word document
    insertTitle = (title: string) => {
        return Word.run(async (context) => {
            this.setState({ titleLoading: true });
            const range = context.document.getSelection();
            const titleRange = range.insertText(title, Word.InsertLocation.start);
            await context.sync();
            //locate the inserted title
            titleRange.select();
        }).catch((error) => {
            message.error(error.message);
        }).finally(async () => {
            this.setState({ titleLoading: false });
        });
    }

    insertFootnote = (citation: string) => {
        return Word.run(async (context) => {
            this.setState({ citationLoading: true });
            const range = context.document.getSelection();
            const footnote = range.insertFootnote(citation);
            await context.sync();
            //locate the inserted footnote
            footnote.body.getRange().select();
        }).catch((error) => {
            message.error(error.message);
        }).finally(() => {
            this.setState({ citationLoading: false });
        });
    }

    insertComment = (comment: string) => {
        return Word.run(async (context) => {
            this.setState({ commentLoading: true });
            const range = context.document.getSelection();
            const insComment = range.insertComment(comment);
            await context.sync();
            //locate the inserted comment
            insComment.getRange().select();
        }).catch((error) => {
            message.error(error.message);
        }).finally(() => {
            this.setState({ commentLoading: false });
        });
    }

    insertPicture = (pictureBase64: string) => {
        return Word.run(async (context) => {
            this.setState({ pictureLoading: true });
            const range = context.document.getSelection();
            const picture = range.insertInlinePictureFromBase64(pictureBase64, Word.InsertLocation.start);
            await context.sync();
            //locate the inserted picture
            picture.getRange().select();
        }).catch((error) => {
            message.error(error.message);
        }).finally(() => {
            this.setState({ pictureLoading: false });
        });
    }

    formatDocument = () => {
        return Word.run(async (context) => {
            this.setState({ formatLoading: true });

            //Set title to Heading 1 and text center alignment
            const firstPara = context.document.body.paragraphs.getFirst();
            firstPara.style = "Heading 1";
            firstPara.alignment = "Centered";
            firstPara.font.highlightColor = "#C0C0C0";
            await context.sync();

            //Set unify the Headings to Heading2 and bold font
            const paragraphs = context.document.body.paragraphs;
            paragraphs.load();
            await context.sync();
            //skip the Title
            for (let i = 1; i < paragraphs.items.length; i++) {
                if (paragraphs.items[i].style.startsWith("Heading")) {
                    paragraphs.items[i].style = "Heading 2";
                    paragraphs.items[i].font.bold = true;
                }
            }
            await context.sync();

            //set the list items of first level to bold
            const lists = context.document.body.lists;
            lists.load();
            await context.sync();
            for (let i = 0; i < lists.items.length; i++) {
                try {
                    const list = lists.items[i];
                    const levelParas = list.getLevelParagraphs(0);
                    levelParas.load();
                    await context.sync();
                    for (let j = 0; j < levelParas.items.length; j++) {
                        const para = levelParas.items[j];
                        para.list.setLevelNumbering(0, Word.ListNumbering.upperRoman)
                        para.font.bold = true;
                        await context.sync();
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            //set the picture to be center alignment
            const pictures = context.document.body.inlinePictures;
            pictures.load();
            await context.sync();
            if (pictures.items.length > 0) {
                for (let k = 0; k < pictures.items.length; k++) {
                    pictures.items[0].paragraph.alignment = "Centered";
                    await context.sync();
                }
            }

        }).catch((error) => {
            message.error(error.message);
        }).finally(() => {
            this.setState({ formatLoading: false })
        });
    }

    insertTemplateDocument = () => {
        return Word.run(async (context) => {
            this.setState({ importTemplateLoading: true });
            context.document.body.clear();
            context.document.body.insertFileFromBase64(predefinedDocumentTemplateBase64, Word.InsertLocation.start);
            await context.sync();
        }).catch((error) => {
            message.error(error.message);
        }).finally(() => {
            this.setState({ importTemplateLoading: false, displayMainFunc: true });
        });
    }

    onMenuClick = async (e) => {
        if ((e.key === "titleAI" || e.key === "citationAI" || e.key === "commentAI")
            && (_apiKey === "" && apiKey === ""
                || _endpoint === "" && endpoint === ""
                || _deployment === "" && deployment === "")) {
            this.setState({ openKeyConfigDialog: true });
            return;
        }
        switch (e.key) {
            case "titleAI":
                await generateText("generate a title of meeting notes", 50).then((text) => {
                    this.insertTitle(text);
                });
                break;
            case "titlePredefined":
                await this.insertTitle(predefinedTitle);
                break;
            case "citationAI":
                await generateText("generate a citation of meeting notes", 50).then((text) => {
                    this.insertFootnote(text);
                });
                break;
            case "citationPredefined":
                await this.insertFootnote(predefinedCitation);
                break;
            case "commentAI":
                await generateText("generate a comment of meeting notes", 50).then((text) => {
                    this.insertComment(text);
                });
                break;
            case "commentPredefined":
                await this.insertComment(predefinedComment);
                break;
            case "formatPredefined":
                await this.formatDocument();
                break;
            case "picturePredefined":
                await this.insertPicture(predefinedPictureBase64);
                break;
        }
    }

    generateMenuItems = (type: string): MenuProps["items"] => {
        return dropdownMenus[type].map((item) => {
            return {
                key: item.key,
                label: <div style={{ textAlign: "center" }}><span>{item.desc}</span></div>,
                onClick: this.onMenuClick
            }
        })
    }

    render() {

        const addTitleItems: MenuProps['items'] = this.generateMenuItems("title");

        const addCitationItems: MenuProps['items'] = this.generateMenuItems("citation");

        const addCommentItems: MenuProps['items'] = this.generateMenuItems("comment");

        const formatDocumentItems: MenuProps['items'] = this.generateMenuItems("format");

        const addPictureItems: MenuProps['items'] = this.generateMenuItems("picture");

        return <>
            <div className="wrapper">
                <div className="main_content">
                    {this.state.displayMainFunc ?

                        <>
                            <div className="back">
                                <div className="cursor" onClick={this.back}>
                                    <LeftOutlined />
                                    <span>Back</span>
                                </div>
                            </div>
                            <div className="main_func">
                                <Dropdown menu={{ items: addTitleItems }} placement="bottom" className="generate_button" arrow>
                                    <Button loading={this.state.titleLoading}>Add a title</Button>
                                </Dropdown>
                                <Dropdown menu={{ items: addCommentItems }} placement="bottom" className="generate_button" arrow>
                                    <Button loading={this.state.commentLoading}>Add comments</Button>
                                </Dropdown>
                                <Dropdown menu={{ items: addCitationItems }} placement="bottom" className="generate_button" arrow>
                                    <Button loading={this.state.citationLoading}>Add citation in footnotes</Button>
                                </Dropdown>
                                <Dropdown menu={{ items: formatDocumentItems }} placement="bottom" className="generate_button" arrow>
                                    <Button loading={this.state.formatLoading}>Format the document</Button>
                                </Dropdown>
                                <Dropdown menu={{ items: addPictureItems }} placement="bottom" className="generate_button" arrow>
                                    <Button loading={this.state.pictureLoading}>Add a picture</Button>
                                </Dropdown>
                            </div>
                            <AIKeyConfigDialog
                                isOpen={this.state.openKeyConfigDialog}
                                endpoint={_endpoint}
                                deployment={_deployment}
                                apiKey={_apiKey}
                                setOpen={this.open.bind(this)}
                                setKey={this.setKey.bind(this)}
                                setEndpoint={this.setEndpoint.bind(this)}
                                setDeployment={this.setDeployment.bind(this)} />
                        </>
                        :
                        <>
                        
                            <div className="survey"><RightOutlined />
                                <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR8GFRbAYEV9Hmqgjcbr7lOdUNVAxQklNRkxCWEtMMFRFN0xXUFhYVlc5Ni4u">
                                    How do you like this sample? Tell us more!
                                </a>
                            </div>
                            <div className="header">
                                <div className="desc">This add-in demonstrate Word add-in capabilities to insert and format content either generated by AI or predefined.</div>
                                <div className="desc">Please start with importing a sample document by clicking below button.</div>
                            </div>
                            <Button className="generate_button"
                                onClick={this.insertTemplateDocument}
                                loading={this.state.importTemplateLoading}>
                                Generate Sample Document
                            </Button>
                        </>
                    }
                </div>
                <div className="bottom">
                    <div className="item_desc">For next steps:</div>
                    <div className="bottom_item">
                        <RightOutlined className="item_icon" />
                        <div className="bottom_item_info">
                            <a href="https://github.com/OfficeDev/Word-Scenario-based-Add-in-Samples">Start your project from this sample</a>
                        </div>
                    </div>
                    <div className="bottom_item">
                        <RightOutlined className="item_icon" />
                        <div className="bottom_item_info">
                            <a href="https://github.com/OfficeDev/Word-Scenario-based-Add-in-Samples">See more samples</a>
                        </div>
                    </div>
                    <div className="bottom_item">
                        <RightOutlined className="item_icon" />
                        <div className="bottom_item_info">
                            <a href="https://learn.microsoft.com/en-us/office/dev/add-ins/quickstarts/word-quickstart?tabs=yeomangenerator">Office add-in documentation</a>
                        </div>
                    </div>
                </div>
            </div >
        </>

    }
}